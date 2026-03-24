import { View, TextInput, Text, FlatList } from "react-native";
import { useState } from "react";
import API from "@/services/api";

export default function Search() {

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async (text) => {
  setQuery(text);
  if (text.length < 2) {
    setResults([]);
    return;
  }

  try {
    const res = await API.get(`product/search?q=${text}`);
    
    // Agar res.data ichida 'error' bo'lsa yoki massiv bo'lmasa
    if (res.data && Array.isArray(res.data)) {
      setResults(res.data);
    } else {
      // Agar {"error": "Product not found"} kelsa, natijani bo'shatamiz
      setResults([]);
      console.log("Backend xabari:", res.data);
    }
  } catch (e) {
    console.log("Aloqa xatosi:", e);
  }
};

  return (
     <View style={{flex:1}}>
    <View style={{
        backgroundColor: "#007AFF",
        padding: 20,
      }}>
        <Text style={{
          color: "white",
          fontSize: 22,
          paddingTop:20,
          fontWeight: "bold"
        }}>
          Mahsulot Izlash
        </Text>
      </View>
    <View style={{ flex:1, padding:20 }}>

      <TextInput
        placeholder="Mahsulot qidirish..."
        value={query}
        onChangeText={handleSearch}
        style={{
          borderWidth:1,
          borderColor:"#ccc",
          borderRadius:10,
          padding:10,
          marginBottom:10
        }}
      />

      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item,index }) => (
          <View style={{
      padding: 15,
      borderBottomWidth: 1,
      borderColor: "#eee",
      flexDirection: 'row', // Yonma-yon joylashtirish uchun
      justifyContent: 'space-between', 
      alignItems: 'center'
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {/* Tartib raqami (index 0 dan boshlangani uchun +1 qo'shamiz) */}
        <Text style={{ fontWeight: 'bold', marginRight: 10, color: '#888' }}>
          {index + 1}.
        </Text>
        
        <View>

          <Text style={{ fontSize: 14   , fontWeight: '500',backgroundColor:'#6ec201',textAlign:"center",padding:2,borderRadius:5 }}>{item.category_name}</Text>
          <Text style={{ fontSize: 16, fontWeight: '500' }}>{item.name}</Text>
          <Text style={{ color: '#007AFF', marginTop: 2 }}>{item.sale_price} so'm</Text>
        </View>
      </View>

      {/* Ombor qoldig'i */}
      <View style={{ 
        backgroundColor: item.stock_count > 2 ? '#5bfd8c83' : '#faaeba', 
        padding: 5, 
        borderRadius: 5 
      }}>
        <Text style={{ 
          fontSize: 12, 
          color: item.stock_count > 2 ? '#00a732' : '#D32F2F',
          fontWeight: 'bold',
          borderRadius:5
        }}>
          Zaxira: {item.stock_count} dona
        </Text>
      </View>
    </View>
        )}
      />

    </View>
    </View>
  );
}