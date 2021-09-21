import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {

  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const stock = (await api.get('stock/' + productId)).data;
      const product = (await api.get('products/' + productId)).data;

      if (stock.amount === 0) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      let tempCart = [...cart];

      const productIndex = tempCart.findIndex(product => product.id === productId);


      if (productIndex >= 0) {
        if ((tempCart[productIndex].amount + 1) > stock.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        } else {
          tempCart[productIndex].amount++
        }
      } else {
        tempCart.push({ ...product, amount: 1 });
      }

      setCart([...tempCart]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(tempCart));
    } catch (err) {
      console.log(err);
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      let index = cart.findIndex(product => product.id === productId);

      if (index === -1) {
        return toast.error('Erro na remoção do produto');
      }

      let tempCart = [...cart]

      tempCart.splice(index, 1);

      setCart(tempCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(tempCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if (amount <= 0) {
        return;
      }

      const tempCart = [...cart];
      console.log(tempCart, productId, amount);
      const stock = (await api.get('stock/' + productId)).data;
      const index = tempCart.findIndex(product => product.id === productId);


      if (stock.amount < amount) {
        return toast.error('Quantidade solicitada fora de estoque');
      }

      tempCart[index].amount = amount;

      setCart(tempCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(tempCart));
    } catch (err) {
      console.log(err);
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
