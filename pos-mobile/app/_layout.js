import { Stack } from "expo-router";
import { CartProvider } from "../context/CartContext";

export default function Layout() {
  return (
    <CartProvider>
      <Stack screenOptions={{headerShown:false}}/>
    </CartProvider>
  );
}