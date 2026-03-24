import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, Alert, StyleSheet } from 'react-native';
import API from "@/services/api";

export default function DebtorsScreen() {
  const [debtors, setDebtors] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  // Qarzdorlarni olish
  const fetchDebtors = async () => {
    try {
      const response = await API.get('debtors/'); // Backenddagi Customer list endpointi
      setDebtors(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchDebtors(); }, []);

  // Qarzni to'lash funksiyasi
  const handlePayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) {
      Alert.alert("Xato", "Summani to'g'ri kiriting");
      return;
    }

    try {
      await API.post('pay-debt/', {
        customer_id: selectedCustomer.id,
        amount: Number(payAmount)
      });

      Alert.alert("Muvaffaqiyatli", "Qarz yopildi!");
      setModalVisible(false);
      setPayAmount("");
      fetchDebtors(); // Ro'yxatni yangilash
    } catch (error) {
      Alert.alert("Xato", "To'lovda xatolik yuz berdi");
      
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Qarzdorlar Ro'yxati</Text>
      
      <FlatList
        data={debtors}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.debtorCard} 
            onPress={() => { setSelectedCustomer(item); setModalVisible(true); }}
          >
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.phone}>{item.phone || "Tel kiritilmagan"}</Text>

               <Text style={styles.historyTitle}>Qarzlar tarixi:</Text>
                {item.history && item.history.map((log, index) => (
      <View key={index} style={styles.historyRow}>
        <View style={{flex: 1}}>
          <Text style={styles.historyNote}>{log.note || "Noma'lum mahsulot"}</Text>
          <Text style={styles.historyDate}>{log.formatted_date}</Text>
        </View>
        <Text style={[styles.historyAmount, { color: log.type === 'borrow' ? '#dc3545' : '#28a745' }]}>
          {log.type === 'borrow' ? '+' : '-'}{log.amount}
        </Text>
      </View>
    ))}

            </View>
            <Text style={styles.debtAmount}>{item.total_debt} so'm</Text>
            
          </TouchableOpacity>
        )}
      />

      {/* Qarzni qaytarish Modali */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedCustomer?.name} - Qarz uzish</Text>
            <Text style={{marginBottom: 10}}>Jami qarz: {selectedCustomer?.total_debt} so'm</Text>
            
            <TextInput
              style={styles.input}
              placeholder="To'lov summasi..."
              keyboardType="numeric"
              value={payAmount}
              onChangeText={setPayAmount}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={{color: 'white'}}>Yopish</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePayment} style={styles.saveBtn}>
                <Text style={{color: 'white'}}>To'lovni saqlash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, marginTop: 20 },
  debtorCard: { 
    backgroundColor: 'white', padding: 15, borderRadius: 10, 
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10,
    elevation: 3 
  },
  name: { fontSize: 16, fontWeight: 'bold' },
  debtAmount: { fontSize: 16, color: '#dc3545', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#6c757d', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveBtn: { flex: 1, backgroundColor: '#28a745', padding: 12, borderRadius: 8, alignItems: 'center' }
});