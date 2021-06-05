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

    const storageCart = localStorage.getItem("@RocketShoes:cart");

    if (storageCart) {
      return JSON.parse(storageCart);
    }

    return [];
  });

  // const previousCart = usePrevious<Product[]>(cart);

  // useEffect(() => {
  //   if (cart && previousCart !== cart) {
  //     localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
  //   }
  // }, [cart, previousCart]);

  const addProduct = async (productId: number) => {
    try {
      const productCart = cart.find(product => product.id === productId);
      const requestedAmount = productCart ? productCart.amount : 0;

      const { data: stock } = await api.get<Stock>(`stock/${productId}`);

      if (!stock || stock.amount < requestedAmount + 1) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = [...cart];

      const product = cart.find(product => product.id === productId);

      if (product) {
        product.amount += 1;
      }
      else {
        const { data: product } = await api.get<Product>(`products/${productId}`);

        updatedCart.push({
          ...product,
          amount: 1
        });
      }

      setCart(updatedCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];

      const index = updatedCart.findIndex(product => product.id === productId);

      if (index !== -1) {
        updatedCart.splice(index, 1);
      }
      else {
        throw new Error();
      }

      setCart(updatedCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch (err) {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount > 0) {
      try {

        const { data: stock } = await api.get<Stock>(`stock/${productId}`);

        if (!stock || stock.amount < amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        const updatedCart = cart.map(product => {
          return product.id !== productId ? product : {
            ...product,
            amount
          }
        });

        setCart(updatedCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } catch {
        toast.error('Erro na alteração de quantidade do produto');
      }
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
