import { useCallback } from 'react';
import { create } from 'zustand';

import {
  decreaseCartCount,
  removeCartByIds,
  increaseCartCount,
  isCheckedAll,
  toggleCart,
  totalPriceOfCheckedCarts,
} from './model';

import { Carts } from 'types/cart';

type State = {
  carts: Carts;
  checked: Set<number>;
};

type Action = {
  actions: {
    initialize: (carts: Carts) => void;
    increase: (id: number) => void;
    decrease: (id: number) => void;
    remove: (ids: number[]) => void;
  };
};

export const useCartStore = create<State & Action>()((set) => ({
  carts: [],
  checked: new Set(),
  actions: {
    initialize: (carts: Carts) => set(() => ({ carts, checked: new Set() })),
    increase: (id: number) => set((state) => ({ carts: increaseCartCount(state.carts, id) })),
    decrease: (id: number) => set((state) => ({ carts: decreaseCartCount(state.carts, id) })),
    remove: (ids: number[]) =>
      set((state) => ({ carts: removeCartByIds(state.carts, ids), checked: new Set() })),
  },
}));

export const useCarts = () => useCartStore((state) => state.carts);
export const useCheckedCartIds = () => useCartStore((state) => state.checked);

export const useIsCheckedAll = () =>
  useCartStore((state) => isCheckedAll(state.carts, state.checked));

export const useTotalPriceOfCheckedCarts = () =>
  useCartStore((state) => totalPriceOfCheckedCarts(state.carts, state.checked));

export const useCartActions = () => {
  const actions = useCartStore((state) => state.actions);
  const checked = useCartStore((state) => state.checked);
  const carts = useCartStore((state) => state.carts);

  const toggle = useCallback(
    (id: number) => {
      const newCheckedIds = toggleCart(checked, id);

      useCartStore.setState(() => ({ checked: newCheckedIds }));
    },
    [checked]
  );

  const checkAll = useCallback(() => {
    const ids = carts.map((cart) => cart.id);

    useCartStore.setState(() => ({ checked: new Set(ids) }));
  }, [carts]);

  const uncheckAll = useCallback(() => {
    useCartStore.setState(() => ({ checked: new Set() }));
  }, []);

  return {
    ...actions,
    toggle,
    checkAll,
    uncheckAll,
  };
};
