import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView, Modal, TextInput } from "react-native";
import { useContext, useState } from "react";
import { CartContext } from "@/context/CartContext";
import API from "@/services/api";

export default function Cart() {
  const { cart, clearCart } = useContext(CartContext);

  // Modal uchun state-lar
  const [modalVisible, setModalVisible] = useState(false);
  const [customerName, setCustomerName] = useState("");

  const total = cart.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 0;
    return sum + price * qty;
  }, 0);

  const handleError = (error) => {
    if (error.response && error.response.data && error.response.data.error) {
      Alert.alert("Xatolik", error.response.data.error);
    } else {
      Alert.alert("Xatolik", "Server bilan bog'lanishda xato yuz berdi.");
    }
  };

  const sell = async () => {
    if (cart.length === 0) {
      Alert.alert("Diqqat!", "Savat bo'sh. Avval mahsulot scan qiling.");
      return;
    }
    try {
      const salesData = cart.map((item) => ({
        barcode: item.barcode,
        quantity: Number(item.quantity),
      }));

      await API.post("sale/", { items: salesData });

      clearCart();
      Alert.alert("Tabrik", "Sotuv muvaffaqiyatli yakunlandi!");
    } catch (error) {
      handleError(error);
    }
  };

  const handleNasiyaSave = async () => {
    if (!customerName.trim()) {
      Alert.alert("Xato", "Mijoz ismini kiriting");
      return;
    }

    try {
      const salesData = cart.map((item) => ({
        barcode: item.barcode,
        quantity: Number(item.quantity),
      }));

      await API.post("nasiya-sale/", {
        items: salesData,
        customer_name: customerName,
        total_amount: total,
      });

      setModalVisible(false);
      setCustomerName("");
      clearCart();
      Alert.alert("Saqlandi", "Nasiya savdo muvaffaqiyatli qayd etildi!");
    } catch (error) {
      handleError(error);
    }
  };

  const cancel = () => {
    clearCart();
    Alert.alert("", "Savat Tozalandi");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Savdo qilish</Text>
      </View>

      <ScrollView style={{ padding: 20 }}>
        {cart.map((item, index) => (
          <View key={item.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "600" }}>
                {index + 1}. {item.name}
              </Text>
              <Text style={{ color: "#666", marginTop: 4 }}>
                {item.price} so'm x {item.quantity} dona
              </Text>
            </View>
            <Text style={{ fontWeight: "700", fontSize: 16, color: "#007AFF" }}>
              {Number(item.price * item.quantity)} so'm
            </Text>
          </View>
        ))}

        <View style={styles.totalContainer}>
          <Text style={{ fontSize: 18, color: "#444" }}>Umumiy summa:</Text>
          <Text style={{ fontSize: 28, fontWeight: "bold", color: "#000" }}>
            {total} so'm
          </Text>
        </View>

        {/* Tugmalar */}
        <View style={{ marginTop: 10, gap: 15, marginBottom: 40 }}>
          <TouchableOpacity onPress={sell} style={[styles.btn, { backgroundColor: "#28a745" }]}>
            <Text style={styles.btnText}>SOTISH</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => (cart.length > 0 ? setModalVisible(true) : Alert.alert("Savat bo'sh"))}
            style={[styles.btn, { backgroundColor: "#f88705" }]}
          >
            <Text style={styles.btnText}>NASIYA SAVDO</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={cancel} style={[styles.btn, { backgroundColor: "#dc3545" }]}>
            <Text style={styles.btnText}>BEKOR QILISH</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* NASIYA UCHUN MODAL */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Mijoz ma'lumotlari</Text>
            <TextInput
              style={styles.input}
              placeholder="Mijoz ismini kiriting..."
              value={customerName}
              onChangeText={setCustomerName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: "#6c757d" }]}
              >
                <Text style={styles.btnText}>Yopish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNasiyaSave}
                style={[styles.modalBtn, { backgroundColor: "#007AFF" }]}
              >
                <Text style={styles.btnText}>Saqlash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "#007AFF", padding: 20, paddingTop: 40 },
  headerTitle: { color: "white", fontSize: 22, fontWeight: "bold", textAlign: "center" },
  card: {
    backgroundColor: "white", padding: 15, borderRadius: 10, marginBottom: 10,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2, shadowRadius: 1.41,
  },
  totalContainer: { marginTop: 20, alignItems: "flex-end", paddingBottom: 20 },
  btn: { padding: 15, borderRadius: 10, alignItems: "center" },
  btnText: { color: "white", fontWeight: "bold", fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "white", padding: 20, borderRadius: 15, alignItems: "center" },
  modalHeader: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  input: { width: "100%", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16 },
  modalButtons: { flexDirection: "row", gap: 10 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center" },
});