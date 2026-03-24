import { View,Alert,Vibration } from "react-native";
import { CameraView } from "expo-camera";
import { Audio } from 'expo-av'
import { useContext, useState } from "react";
import { CartContext } from "@/context/CartContext";
import API from "@/services/api";

export default function ScanScreen() {

  const { addToCart } = useContext(CartContext);

  const [scanned, setScanned] = useState(false);
  const playBeep = async () => {
    
    const { sound } = await Audio.Sound.createAsync(
      require("@/assets/beep.mp3")
    );
    
    await sound.playAsync();
    
  };
  
  const handleScan = async (result) => {
  if (scanned) return;
  const barcode = result.data.trim();

  // agar URL bo'lsa ignore qilamiz
  if (barcode.startsWith("http")) {
    console.log("QR code ignored:", barcode);
    return;
  }

  setScanned(true);

 try {
    // 1. Eng birinchi tekshiruv: Barcode umuman o'qildimi?
    
    if (barcode == false) {
      
      Alert.alert("Xatolik", "Skaner shtrix-kodni aniqlay olmadi. Qayta urinib ko'ring.",[
        {text:"OK",onPress: () => setScanned(false)}
      ]);
      return; // Funksiyani to'xtatamiz, API'ga so'rov ketmaydi
    }
    
    const res = await API.get(`product/${barcode}/`);
    
    
    // 2. Agar API muvaffaqiyatli javob qaytarsa, lekin ma'lumot bo'sh bo'lsa
    if (res.data && res.data.name) {
      console.log(res.data.barcode || barcode);
      
      Alert.alert("Muvaffaqiyatli", `${res.data.name} cartga qo'shildi`);
      const completeProduct = {
        ...res.data,
        barcode: res.data.barcode || barcode
      }
      
      addToCart(completeProduct);
      playBeep();
      Vibration.vibrate(100);
    } else {
      // Ba'zida API 200 qaytaradi, lekin data bo'sh bo'ladi
      Alert.alert("Xatolik", "Mahsulot ma'lumotlari topilmadi.");
    }

} catch (error) {
    // 3. Agar Django 404 qaytarsa yoki internet bo'lmasa shu yerga tushadi
    console.log("Xatolik tafsiloti:", error);
    Alert.alert("Topilmadi", "Bunday shtrix-kodli mahsulot bazada mavjud emas.");
}

  setTimeout(() => setScanned(false), 1500);

};

  return (
    <View style={{ flex:1 }}>
      <CameraView
        style={{ flex:1 }}
        onBarcodeScanned={handleScan}
      />
    </View>
  );
}