import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function Dashboard() {

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
          POS Dashboard
        </Text>
      </View>
    <View style={{flexDirection:'row', justifyContent:'space-between',  padding:10 }}>
        <TouchableOpacity style={styles.btn}
        onPress={() => router.push("/(tabs)/scan")}>
        <Text style={{color:'#fff',flexWrap:'wrap',textAlign:'center'}}>📷 Mahsulotni {'\n'} skanerlash</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn}
        onPress={() => router.push("/(tabs)/cart")}>
        <Text  style={{color:'#fff',flexWrap:'wrap',textAlign:'center'}}>🛒 Basketga o'tish</Text>
      </TouchableOpacity>
      </View>

      <View style={{flexDirection:'row', justifyContent:'space-between', padding:20, }}>
      <TouchableOpacity style={styles.btn}
        onPress={() => router.push("/(tabs)/search")}>
             <Ionicons name="search" size={24} color="white" />
        <Text  style={{color:'#fff',flexWrap:'wrap',textAlign:'center',paddingLeft:10}}>Izlash</Text>
      </TouchableOpacity>

        <TouchableOpacity style={styles.btn}
        onPress={() => router.push("/(tabs)/cart")}>
             <Ionicons name="return-down-back" size={26} color="white" />
        <Text  style={{color:'#fff',flexWrap:'wrap',textAlign:'center', paddingLeft:10}}>Mahsulotni {'\n'} qaytarish</Text>
      </TouchableOpacity>
      </View>

      <View style={{flexDirection:'row', justifyContent:'space-between', padding:20 }}>
      <TouchableOpacity style={styles.btn}
        onPress={() => router.push("/(tabs)/refund")}>
            <Ionicons name="cash" size={24} color="white" />
        <Text  style={{color:'#fff',flexWrap:'wrap',textAlign:'center',paddingLeft:10}}>Qarz qaytarish</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn}
        onPress={() => router.push("/(tabs)/inventory")}>
            <Ionicons name="cube" size={24} color="white" />
        <Text  style={{color:'#fff',flexWrap:'wrap',textAlign:'center',paddingLeft:10}}>Ombor</Text>
      </TouchableOpacity>
    
    </View>

    <View style={{flexDirection:'row', justifyContent:'space-between', padding:20 }}>
      <TouchableOpacity style={styles.btn}
        onPress={() => router.push("/(tabs)/daily")}>
            <Ionicons name="calendar" size={24} color="white" />
        <Text  style={{color:'#fff',flexWrap:'wrap',textAlign:'center',paddingLeft:10}}>Kunlik Savdo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn}
        onPress={() => router.push("/(tabs)/inventory")}>
            <Ionicons name="cube" size={24} color="white" />
        <Text  style={{color:'#fff',flexWrap:'wrap',textAlign:'center',paddingLeft:10}}>Nomalum</Text>
      </TouchableOpacity>
    
    </View>
    </View>
    
  );
}

const styles = {
  btn: {
    padding:10,
    height:70,
    width:"48%",
    backgroundColor:"#007AFF",
    flexDirection:'row',
    justifyContent:"center",
    alignItems:"center",
    borderRadius:10,
    marginBottom:10
}


  
};