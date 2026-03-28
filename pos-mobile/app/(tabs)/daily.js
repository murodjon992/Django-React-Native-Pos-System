
import React, { useEffect, useState,useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import api from '@/services/api'

const DailyReport = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchReport = () => {
        api.get('/daily-summary/')
            .then(res => {
                // Backend'dan kelayotgan res.data ni tekshiring
                setData(res.data); 
                setLoading(false);
                setRefreshing(false);
            })
            .catch(err => {
                console.log("Xatolik:", err);
                setLoading(false);
                setRefreshing(false);
            });
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchReport();
    };

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#007AFF" />
        </View>
    );

    // Agar data hali kelmagan bo'lsa xato bermasligi uchun
    if (!data) return <View style={styles.center}><Text>Ma'lumot topilmadi</Text></View>;

    return (
        <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>
                    Bugungi Hisobot: {data.date}
                </Text>
            </View>

            <ScrollView 
                contentContainerStyle={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Asosiy Karta */}
                <View style={[styles.box, { backgroundColor: '#007AFF' }]}>
                    <Text style={styles.label}>Umumiy Savdo</Text>
                    <Text style={styles.amount}>
                        {data.grand_total?.toLocaleString() || 0} so'm
                    </Text>
                </View>

                {/* Tafsilotlar */}
                <View style={styles.whiteCard}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>💵 Naqd:</Text>
                        <Text style={styles.bold}>{data.details?.cash?.toLocaleString() || 0} so'm</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>💳 Plastik:</Text>
                        <Text style={styles.bold}>{data.details?.card?.toLocaleString() || 0} so'm</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>📝 Nasiya:</Text>
                        <Text style={styles.bold}>{data.details?.debt?.toLocaleString() || 0} so'm</Text>
                    </View>
                </View>

                <View style={[styles.whiteCard, { marginTop: 20 }]}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>📦 Sotilgan mahsulotlar:</Text>
                        <Text style={styles.bold}>{data.items_count || 0} ta</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerContainer: {
        backgroundColor: "#007AFF",
        padding: 20,
        paddingTop: 40,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerTitle: {
        color: "white",
        fontSize: 20,
        fontWeight: "bold",
        textAlign: 'center'
    },
    container: { padding: 20 },
    box: { 
        padding: 25, 
        borderRadius: 20, 
        alignItems: 'center', 
        marginBottom: 20,
        elevation: 5, // Android soya
        shadowColor: '#000', // iOS soya
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    label: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 5 },
    amount: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
    whiteCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        elevation: 2,
    },
    detailRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingVertical: 12, 
        borderBottomWidth: 1, 
        borderColor: '#f0f0f0' 
    },
    detailLabel: { fontSize: 16, color: '#555' },
    bold: { fontWeight: 'bold', fontSize: 16, color: '#333' }
});

export default DailyReport;