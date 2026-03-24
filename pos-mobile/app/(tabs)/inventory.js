import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import API from "@/services/api";

const InventoryScreen = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // all, out, low

  const fetchInventory = async () => {
    try {
      setLoading(true);
      // Django API manzilingiz
     const res = await API.get(`/inventory`);
      setData(res.data);
      
    } catch (error) {
      console.error("Xatolik:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  // Frontend filtrlash mantiqi
  const filteredProducts = data.filter(item => {
    if (activeFilter === 'out') return item.quantity === 0;
    if (activeFilter === 'low') return item.quantity > 0 && item.quantity <= 10;
    return true;
  });

  const renderProduct = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.productName}>{item.product_name}</Text>
        <Text style={styles.categoryText}>{item.category_name}</Text>
        <Text style={styles.barcodeText}>ID: {item.barcode}</Text>
      </View>
      
      <View style={[styles.statusBadge, 
        { backgroundColor: item.quantity === 0 ? '#fad8dd' : (item.quantity <= 10 ? '#fffde7' : '#e8f5e9') }]}>
        <Text style={[styles.quantityText, 
          { color: item.quantity === 0 ? '#d32f2f' : (item.quantity <= 10 ? '#fbc02d' : '#388e3c') }]}>
          {item.quantity} dona
        </Text>
      </View>
    </View>
  );

  return (

     <View style={{flex:1}}>
    <View style={{
        backgroundColor: "#007AFF",
        padding: 20,
        marginBottom:20
      }}>
        <Text style={{
          color: "white",
          fontSize: 22,
          paddingTop:20,
          fontWeight: "bold"
        }}>
         Ombor Nazorati
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        {['all', 'low', 'out'].map((f) => (
          <TouchableOpacity 
            key={f}
            onPress={() => setActiveFilter(f)}
            style={[styles.tab, activeFilter === f && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeFilter === f && styles.activeTabText]}>
              {f === 'all' ? 'Hammasi' : f === 'low' ? 'Kam qolgan' : 'Tugagan'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProduct}
          ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20}}>Mahsulot topilmadi</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#d8d8d8', padding: 15 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, color: '#454557' },
  tabContainer: { flexDirection: 'row', marginBottom: 15, backgroundColor: '#007AFF', borderRadius: 10, padding: 2 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#FFFFFF', elevation: 2, shadowOpacity: 0.1 },
  tabText: { fontSize: 13, color: '#ffffff' },
  activeTabText: { color: '#000', fontWeight: '600' },
  card: { 
    backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 10, 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' 
  },
  productName: { fontSize: 16, fontWeight: 'bold' },
  categoryText: { fontSize: 12, color: '#2222f5',  marginTop: 2 },
  barcodeText: { fontSize: 11, color: '#C7C7CC', marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  quantityText: { fontWeight: 'bold', fontSize: 14 }
});

export default InventoryScreen;