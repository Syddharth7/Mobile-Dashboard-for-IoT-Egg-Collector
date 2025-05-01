import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { LineChart as LineChartAnimated } from 'react-native-gifted-charts';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { Calendar } from 'react-native-calendars';

export default function DashboardScreen() {
  const [eggCounts, setEggCounts] = useState({
    small: 0,
    medium: 0,
    large: 0,
    xl: 0,
    jumbo: 0,
    spoiled: 0,
    cracked: 0,
    total: 0
  });
  
 
  const [historicalData, setHistoricalData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState('week');
  const [showCalendar, setShowCalendar] = useState(false);
  
  
  const [systemStatus, setSystemStatus] = useState('OFF');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logMessages, setLogMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('today');
  
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const spinValue = useRef(new Animated.Value(0)).current;
  const chartAnimation = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef(null);
  

  const today = new Date().toISOString().split('T')[0];

  
  const startOfDay = `${selectedDate}T00:00:00.000Z`;
  const endOfDay = `${selectedDate}T23:59:59.999Z`;
  
 
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start();
    
    
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();
    
    if (lottieRef.current) {
      lottieRef.current.play();
    }
  }, []);
  
  
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  async function fetchEggCounts(date = selectedDate) {
    try {
      setLoading(true);
      
      const dayStart = `${date}T00:00:00.000Z`;
      const dayEnd = `${date}T23:59:59.999Z`;
      
      
      const { data: smallEggs } = await supabase
        .from('eggs')
        .select('*')
        .eq('size', 'SMALL')
        .gte('collected_at', dayStart)
        .lte('collected_at', dayEnd);
      
      const { data: mediumEggs } = await supabase
        .from('eggs')
        .select('*')
        .eq('size', 'MEDIUM')
        .gte('collected_at', dayStart)
        .lte('collected_at', dayEnd);
      
      const { data: largeEggs } = await supabase
        .from('eggs')
        .select('*')
        .eq('size', 'LARGE')
        .gte('collected_at', dayStart)
        .lte('collected_at', dayEnd);
      
      const { data: xlEggs } = await supabase
        .from('eggs')
        .select('*')
        .eq('size', 'XL')
        .gte('collected_at', dayStart)
        .lte('collected_at', dayEnd);
      
      const { data: jumboEggs } = await supabase
        .from('eggs')
        .select('*')
        .eq('size', 'JUMBO')
        .gte('collected_at', dayStart)
        .lte('collected_at', dayEnd);
      
     
      const { data: spoiledEggs } = await supabase
        .from('eggs')
        .select('*')
        .eq('quality', 'SPOILED')
        .gte('collected_at', dayStart)
        .lte('collected_at', dayEnd);
      
      const { data: crackedEggs } = await supabase
        .from('eggs')
        .select('*')
        .eq('quality', 'CRACKED')
        .gte('collected_at', dayStart)
        .lte('collected_at', dayEnd);
      
      const { data: allEggs } = await supabase
        .from('eggs')
        .select('*')
        .gte('collected_at', dayStart)
        .lte('collected_at', dayEnd);
      
      
      setEggCounts({
        small: smallEggs?.length || 0,
        medium: mediumEggs?.length || 0,
        large: largeEggs?.length || 0,
        xl: xlEggs?.length || 0,
        jumbo: jumboEggs?.length || 0,
        spoiled: spoiledEggs?.length || 0,
        cracked: crackedEggs?.length || 0,
        total: allEggs?.length || 0
      });

      
      const { data: logs } = await supabase
        .from('system_logs')
        .select('*')
        .order('log_time', { ascending: false })
        .limit(10);
      
      setLogMessages(logs || []);
      
      Animated.timing(chartAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.elastic(1)
      }).start();
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }
  
  async function fetchHistoricalData() {
    try {
      setLoading(true);
      
      let fromDate;
      const toDate = new Date();
      
      
      if (dateRange === 'week') {
        fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 7);
      } else if (dateRange === 'month') {
        fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - 1);
      } else {
        fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - 3);
      }
      
      const fromDateStr = fromDate.toISOString().split('T')[0];
      const toDateStr = toDate.toISOString().split('T')[0];
      
      
      const { data, error } = await supabase
        .rpc('get_eggs_by_date', {
          from_date: `${fromDateStr}T00:00:00.000Z`,
          to_date: `${toDateStr}T23:59:59.999Z`
        });
      
      if (error) {
        console.error('Error fetching historical data:', error);
        
        const mockData = generateMockHistoricalData(dateRange);
        setHistoricalData(mockData);
      } else if (data && data.length > 0) {
        setHistoricalData(data);
      } else {
      
        const mockData = generateMockHistoricalData(dateRange);
        setHistoricalData(mockData);
      }
      
    } catch (error) {
      console.error('Error in historical data fetch:', error);
      const mockData = generateMockHistoricalData(dateRange);
      setHistoricalData(mockData);
    } finally {
      setLoading(false);
    }
  }
  
 
  function generateMockHistoricalData(range) {
    const data = [];
    const end = new Date();
    let start;
    
    if (range === 'week') {
      start = new Date();
      start.setDate(end.getDate() - 7);
    } else if (range === 'month') {
      start = new Date();
      start.setMonth(end.getMonth() - 1);
    } else {
      start = new Date();
      start.setMonth(end.getMonth() - 3);
    }
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const date = d.toISOString().split('T')[0];
    
      const baseCount = Math.floor(Math.random() * 10) + 20;
      
      data.push({
        date,
        total_eggs: baseCount + Math.floor(Math.random() * 15),
        small_eggs: Math.floor(Math.random() * 8) + 2,
        medium_eggs: Math.floor(Math.random() * 10) + 5,
        large_eggs: Math.floor(Math.random() * 12) + 8,
        xl_eggs: Math.floor(Math.random() * 6) + 1,
        jumbo_eggs: Math.floor(Math.random() * 4),
        spoiled_eggs: Math.floor(Math.random() * 3),
        cracked_eggs: Math.floor(Math.random() * 2)
      });
    }
    
    return data;
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchEggCounts();
    fetchHistoricalData();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  useEffect(() => {
    fetchEggCounts();
    fetchHistoricalData();
    
   
    const logSubscription = supabase
      .channel('system_logs')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'system_logs' 
      }, payload => {
        setLogMessages(prevLogs => [payload.new, ...prevLogs].slice(0, 10));
      })
      .subscribe();
    
   
    return () => {
      supabase.removeChannel(logSubscription);
    };
  }, []);
  
  useEffect(() => {
    if (activeTab === 'today') {
      fetchEggCounts();
    } else {
      fetchHistoricalData();
    }
  }, [activeTab, selectedDate, dateRange]);

  const toggleSystem = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newStatus = systemStatus === 'ON' ? 'OFF' : 'ON';
    setSystemStatus(newStatus);
    
  
    if (lottieRef.current) {
      if (newStatus === 'ON') {
        lottieRef.current.play();
      } else {
        lottieRef.current.pause();
      }
    }
    
    
    const { error } = await supabase
      .from('system_logs')
      .insert([{ 
        log_message: `System ${newStatus}`, 
        log_type: 'STATUS', 
        log_time: new Date().toISOString() 
      }]);
    
    if (error) {
      console.error('Error logging status change:', error);
    }
  };

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };
  
  const handleDateChange = (date) => {
    setSelectedDate(date.dateString);
    setShowCalendar(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const changeTab = (tab) => {
    setActiveTab(tab);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const changeDateRange = (range) => {
    setDateRange(range);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const chartData = {
    labels: ['Small', 'Medium', 'Large', 'XL', 'Jumbo'],
    datasets: [
      {
        data: [
          eggCounts.small,
          eggCounts.medium,
          eggCounts.large,
          eggCounts.xl,
          eggCounts.jumbo,
        ],
        color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };
  
  
  const prepareLineChartData = () => {
    if (!historicalData || historicalData.length === 0) return null;
    
    const labels = historicalData.map(item => item.date.substring(5)); // Get MM-DD format
    const data = historicalData.map(item => item.total_eggs);
    
    return {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => `rgba(65, 143, 244, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };
  
  
  const prepareAnimatedLineData = () => {
    if (!historicalData || historicalData.length === 0) return [];
    
    return historicalData.map((item, index) => ({
      value: item.total_eggs,
      label: item.date.substring(5),
      dataPointText: index === historicalData.length - 1 ? item.total_eggs.toString() : '',
    }));
  };

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    color: (opacity = 1) => `rgba(72, 72, 72, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 10,
      fill: '#777777',
    },
    propsForBackgroundLines: {
      stroke: '#E5E5E5',
      strokeDasharray: '0',
    },
  };
  
  const lineChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(65, 143, 244, ${opacity})`,
    strokeWidth: 3,
  };

  const screenWidth = Dimensions.get('window').width - 40;

  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

 
  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString(undefined, options);
  };
  
 
  const formatSelectedDate = (date) => {
    if (date === today) return 'Today';
    const options = { month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString(undefined, options);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View>
          <Text style={styles.headerTitle}>Egg Sorting Dashboard</Text>
          <TouchableOpacity onPress={toggleCalendar} style={styles.dateSelector}>
            <Text style={styles.headerDate}>
              {activeTab === 'today' 
                ? formatDate(selectedDate) 
                : `${dateRange.charAt(0).toUpperCase() + dateRange.slice(1)}ly View`}
            </Text>
            <Ionicons name="calendar-outline" size={14} color="#757575" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.systemLabel}>SYSTEM</Text>
          <TouchableOpacity 
            style={[
              styles.systemSwitch, 
              { backgroundColor: systemStatus === 'ON' ? '#4CAF50' : '#9E9E9E' }
            ]}
            onPress={toggleSystem}
          >
            <Text style={styles.systemText}>{systemStatus}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      {/* Tab Navigation */}
      <Animated.View 
        style={[
          styles.tabContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0]
            }) }]
          }
        ]}
      >
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'today' && styles.activeTab]}
          onPress={() => changeTab('today')}
        >
          <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>Today's Data</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => changeTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Historical Data</Text>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Calendar Popup */}
      {showCalendar && (
        <Animated.View 
          style={[
            styles.calendarContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: fadeAnim }]  
            }
          ]}
        >
          <Calendar
            current={selectedDate}
            maxDate={today}
            onDayPress={handleDateChange}
            markedDates={{
              [selectedDate]: { selected: true, selectedColor: '#4CAF50' }
            }}
            theme={{
              selectedDayBackgroundColor: '#4CAF50',
              todayTextColor: '#4CAF50',
              arrowColor: '#4CAF50',
            }}
          />
          <TouchableOpacity 
            style={styles.closeCalendarButton} 
            onPress={() => setShowCalendar(false)}
          >
            <Text style={styles.closeCalendarText}>Close</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#757575" />
        }
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#757575" />
            <Text style={styles.loadingText}>Loading data...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'today' ? (
           
              <Animated.View style={{
                opacity: fadeAnim,
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })
                }]
              }}>
                <Animated.View 
                  style={[
                    styles.summaryCard,
                    { transform: [{ scale: scaleAnim }] }
                  ]}
                >
                  <View style={styles.summaryHeader}>
                    <Text style={styles.summaryTitle}>TODAY'S COLLECTION</Text>
                    <MaterialCommunityIcons name="egg-outline" size={20} color="#757575" />
                  </View>
                  <View style={styles.totalCountContainer}>
                    <View>
                      <Text style={styles.totalCountLabel}>TOTAL EGGS</Text>
                      <Text style={styles.collectionDate}>{formatSelectedDate(selectedDate)}</Text>
                    </View>
                    <Animated.Text 
                      style={[
                        styles.totalCountValue,
                        { transform: [{ scale: chartAnimation }] }
                      ]}
                    >
                      {eggCounts.total}
                    </Animated.Text>
                  </View>
                </Animated.View>
                
                <Animated.View 
                  style={[
                    styles.sectionContainer,
                    { 
                      opacity: fadeAnim,
                      transform: [{
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0]
                        })
                      }]
                    }
                  ]}
                >
                  <Text style={styles.sectionTitle}>Count by Size</Text>
                  <View style={styles.countCardsContainer}>
                    {[
                      { label: 'SMALL', value: eggCounts.small, icon: 'egg-outline', size: 18 },
                      { label: 'MEDIUM', value: eggCounts.medium, icon: 'egg-outline', size: 20 },
                      { label: 'LARGE', value: eggCounts.large, icon: 'egg-outline', size: 22 },
                      { label: 'XL', value: eggCounts.xl, icon: 'egg-outline', size: 24 },
                      { label: 'JUMBO', value: eggCounts.jumbo, icon: 'egg-outline', size: 26 }
                    ].map((item, index) => (
                      <Animated.View 
                        key={item.label}
                        style={[
                          styles.countCard,
                          { 
                            transform: [{
                              translateY: fadeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [20 * (index + 1), 0]
                              })
                            }]
                          }
                        ]}
                      >
                        <View style={styles.countCardHeader}>
                          <Text style={styles.countCardLabel}>{item.label}</Text>
                          <MaterialCommunityIcons name={item.icon} size={item.size} color="#757575" />
                        </View>
                        <Text style={styles.countCardValue}>{item.value}</Text>
                      </Animated.View>
                    ))}
                  </View>
                </Animated.View>
                
                <Animated.View 
                  style={[
                    styles.sectionContainer,
                    { 
                      opacity: fadeAnim,
                      transform: [{
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [40, 0]
                        })
                      }]
                    }
                  ]}
                >
                  <Text style={styles.sectionTitle}>Quality Report</Text>
                  <View style={styles.qualityCardsContainer}>
                    <Animated.View 
                      style={[
                        styles.countCard, 
                        styles.qualityCard,
                        { 
                          transform: [{
                            translateX: fadeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-30, 0]
                            })
                          }]
                        }
                      ]}
                    >
                      <View style={styles.countCardHeader}>
                        <Text style={styles.countCardLabel}>SPOILED</Text>
                        <Ionicons name="warning-outline" size={18} color="#FF9800" />
                      </View>
                      <Text style={[styles.countCardValue, { color: '#FF9800' }]}>{eggCounts.spoiled}</Text>
                    </Animated.View>
                    <Animated.View 
                      style={[
                        styles.countCard, 
                        styles.qualityCard,
                        { 
                          transform: [{
                            translateX: fadeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [30, 0]
                            })
                          }]
                        }
                      ]}
                    >
                      <View style={styles.countCardHeader}>
                        <Text style={styles.countCardLabel}>CRACKED</Text>
                        <Ionicons name="close-circle-outline" size={18} color="#F44336" />
                      </View>
                      <Text style={[styles.countCardValue, { color: '#F44336' }]}>{eggCounts.cracked}</Text>
                    </Animated.View>
                  </View>
                </Animated.View>
                
                <Animated.View 
                  style={[
                    styles.chartCard,
                    {
                      opacity: fadeAnim,
                      transform: [{ 
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0]
                        })
                      }]
                    }
                  ]}
                >
                  <Text style={styles.chartTitle}>Egg Distribution by Size</Text>
                  <Animated.View style={{ 
                    opacity: chartAnimation,
                    transform: [{ 
                      scaleY: chartAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.7, 1]
                      })
                    }]
                  }}>
                    <BarChart
                      data={chartData}
                      width={screenWidth}
                      height={220}
                      chartConfig={chartConfig}
                      style={styles.chart}
                      yAxisLabel=""
                      yAxisSuffix=""
                      fromZero
                      showBarTops={false}
                    />
                  </Animated.View>
                </Animated.View>
              </Animated.View>
            ) : (
     
              <Animated.View style={{
                opacity: fadeAnim,
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })
                }]
              }}>
                <View style={styles.dateRangePicker}>
                  <TouchableOpacity 
                    style={[styles.dateRangeButton, dateRange === 'week' && styles.activeDateRange]} 
                    onPress={() => changeDateRange('week')}
                  >
                    <Text style={[styles.dateRangeText, dateRange === 'week' && styles.activeDateRangeText]}>Week</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.dateRangeButton, dateRange === 'month' && styles.activeDateRange]}
                    onPress={() => changeDateRange('month')}
                  >
                    <Text style={[styles.dateRangeText, dateRange === 'month' && styles.activeDateRangeText]}>Month</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.dateRangeButton, dateRange === 'quarter' && styles.activeDateRange]}
                    onPress={() => changeDateRange('quarter')}
                  >
                    <Text style={[styles.dateRangeText, dateRange === 'quarter' && styles.activeDateRangeText]}>Quarter</Text>
                  </TouchableOpacity>
                </View>
                
                <Animated.View 
                  style={[
                    styles.chartCard,
                    { 
                      marginTop: 0,
                      opacity: fadeAnim,
                      transform: [{ 
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0]
                        })
                      }]
                    }
                  ]}
                >
                  <Text style={styles.chartTitle}>Egg Production Trend</Text>
                  <View style={styles.trendSummary}>
                    <View style={styles.trendMetric}>
                      <Text style={styles.trendLabel}>TOTAL</Text>
                      <Text style={styles.trendValue}>
                        {historicalData.reduce((sum, day) => sum + day.total_eggs, 0)}
                      </Text>
                    </View>
                    <View style={styles.trendMetric}>
                      <Text style={styles.trendLabel}>AVG/DAY</Text>
                      <Text style={styles.trendValue}>
                        {Math.round(historicalData.reduce((sum, day) => sum + day.total_eggs, 0) / historicalData.length)}
                      </Text>
                    </View>
                    <View style={styles.trendMetric}>
                      <Text style={styles.trendLabel}>PEAK</Text>
                      <Text style={styles.trendValue}>
                        {Math.max(...historicalData.map(day => day.total_eggs))}
                      </Text>
                    </View>
                  </View>
                  
                  <Animated.View style={{ 
                    opacity: chartAnimation,
                    transform: [{ 
                      scaleY: chartAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.7, 1]
                      })
                    }]
                  }}>
                    <LineChartAnimated
                      data={prepareAnimatedLineData()}
                      width={screenWidth}
                      height={220}
                      backgroundColor="#fff"
                      spacing={12}
                      initialSpacing={10}
                      hideDataPoints={false}
                      color="#418FF4"
                      thickness={3}
                      startFillColor="rgba(65, 143, 244, 0.2)"
                      endFillColor="rgba(65, 143, 244, 0.0)"
                      startOpacity={0.6}
                      endOpacity={0.1}
                      yAxisColor="#DEDEDE"
                      xAxisColor="#DEDEDE"
                      pointerConfig={{
                        radius: 5,
                        pointerStripHeight: 140,
                        pointerStripColor: '#DEDEDE',
                        pointerStripWidth: 1,
                        pointerColor: '#418FF4',
                      }}
                    />
                  </Animated.View>
                </Animated.View>
                
                <Animated.View
                  style={[
                    styles.historyCards,
                    { 
                      opacity: fadeAnim,
                      transform: [{ 
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [40, 0]
                        })
                      }]
                    }
                  ]}
                >
                  <Text style={styles.sectionTitle}>Size Distribution</Text>
                  <View style={styles.historyMetrics}>
                    <View style={styles.historySizeCard}>
                      <View style={styles.sizeBarContainer}>
                        <View style={[styles.sizeBar, {backgroundColor: '#7986CB', height: '80%'}]} />
                        <View style={[styles.sizeBar, {backgroundColor: '#4DD0E1', height: '60%'}]} />
                        <View style={[styles.sizeBar, {backgroundColor: '#4CAF50', height: '90%'}]} />
                        <View style={[styles.sizeBar, {backgroundColor: '#FFA726', height: '40%'}]} />
                        <View style={[styles.sizeBar, {backgroundColor: '#EF5350', height: '30%'}]} />
                      </View>
                      <View style={styles.sizeLegend}>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendColor, {backgroundColor: '#7986CB'}]} />
                          <Text style={styles.legendText}>Small</Text>
                        </View>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendColor, {backgroundColor: '#4DD0E1'}]} />
                          <Text style={styles.legendText}>Medium</Text>
                        </View>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendColor, {backgroundColor: '#4CAF50'}]} />
                          <Text style={styles.legendText}>Large</Text>
                        </View>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendColor, {backgroundColor: '#FFA726'}]} />
                          <Text style={styles.legendText}>XL</Text>
                        </View>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendColor, {backgroundColor: '#EF5350'}]} />
                          <Text style={styles.legendText}>Jumbo</Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.historyQualityCard}>
                      <Text style={styles.historyQualityTitle}>Quality Analysis</Text>
                      <View style={styles.historyQualityStats}>
                        <View style={styles.qualityStat}>
                          <Text style={styles.qualityStatLabel}>Good Eggs</Text>
                          <Text style={styles.qualityStatValue}>
                            {Math.round((historicalData.reduce((sum, day) => sum + day.total_eggs, 0) - 
                              historicalData.reduce((sum, day) => sum + day.spoiled_eggs + day.cracked_eggs, 0)) /
                              historicalData.reduce((sum, day) => sum + day.total_eggs, 0) * 100)}%
                          </Text>
                        </View>
                        <View style={styles.qualityStat}>
                          <Text style={styles.qualityStatLabel}>Damaged</Text>
                          <Text style={[styles.qualityStatValue, {color: '#F44336'}]}>
                            {Math.round(historicalData.reduce((sum, day) => sum + day.spoiled_eggs + day.cracked_eggs, 0) /
                              historicalData.reduce((sum, day) => sum + day.total_eggs, 0) * 100)}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Animated.View>
                
                <Animated.View
                  style={[
                    styles.previousCollectionsCard,
                    { 
                      opacity: fadeAnim,
                      transform: [{ 
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0]
                        })
                      }]
                    }
                  ]}
                >
                  <Text style={styles.previousCollectionsTitle}>Previous Collections</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.previousCollectionsScroll}
                  >
                    {historicalData.slice(0).reverse().slice(0, 5).map((day, index) => (
                      <Animated.View 
                        key={index} 
                        style={[
                          styles.previousCollectionDay,
                          { 
                            opacity: fadeAnim,
                            transform: [{ 
                              translateX: fadeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [30 * index, 0]
                              })
                            }]
                          }
                        ]}
                      >
                        <Text style={styles.previousCollectionDate}>
                          {new Date(day.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                        </Text>
                        <View style={styles.prevCollectionCount}>
                          <MaterialCommunityIcons name="egg-outline" size={24} color="#424242" />
                          <Text style={styles.prevCollectionTotal}>{day.total_eggs}</Text>
                        </View>
                        <View style={styles.prevCollectionSizes}>
                          <View style={styles.prevCollectionSize}>
                            <Text style={styles.prevCollectionSizeLabel}>S</Text>
                            <Text style={styles.prevCollectionSizeValue}>{day.small_eggs}</Text>
                          </View>
                          <View style={styles.prevCollectionSize}>
                            <Text style={styles.prevCollectionSizeLabel}>M</Text>
                            <Text style={styles.prevCollectionSizeValue}>{day.medium_eggs}</Text>
                          </View>
                          <View style={styles.prevCollectionSize}>
                            <Text style={styles.prevCollectionSizeLabel}>L</Text>
                            <Text style={styles.prevCollectionSizeValue}>{day.large_eggs}</Text>
                          </View>
                          <View style={styles.prevCollectionSize}>
                            <Text style={styles.prevCollectionSizeLabel}>XL</Text>
                            <Text style={styles.prevCollectionSizeValue}>{day.xl_eggs}</Text>
                          </View>
                          <View style={styles.prevCollectionSize}>
                            <Text style={styles.prevCollectionSizeLabel}>J</Text>
                            <Text style={styles.prevCollectionSizeValue}>{day.jumbo_eggs}</Text>
                          </View>
                        </View>
                      </Animated.View>
                    ))}
                  </ScrollView>
                </Animated.View>
              </Animated.View>
            )}
            
            {/* System Logs - Visible in both tabs */}
            <Animated.View 
              style={[
                styles.logsCard,
                { 
                  opacity: fadeAnim,
                  transform: [{ 
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [60, 0]
                    })
                  }]
                }
              ]}
            >
              <View style={styles.logsTitleContainer}>
                <Text style={styles.logsTitle}>System Logs</Text>
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons name="sync" size={16} color="#757575" />
                </Animated.View>
              </View>
              {logMessages.length > 0 ? (
                logMessages.map((log, index) => (
                  <Animated.View 
                    key={index} 
                    style={[
                      styles.logItem,
                      { 
                        opacity: fadeAnim,
                        transform: [{ 
                          translateX: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-20, 0]
                          })
                        }]
                      }
                    ]}
                  >
                    <View style={styles.logIconContainer}>
                      <Ionicons 
                        name={log.log_type === 'STATUS' ? 'power' : 'information-circle'} 
                        size={18} 
                        color={log.log_type === 'STATUS' ? '#4CAF50' : '#757575'} 
                      />
                    </View>
                    <Text style={styles.logMessage}>{log.log_message}</Text>
                    <Text style={styles.logTime}>
                      {formatTime(log.log_time)}
                    </Text>
                  </Animated.View>
                ))
              ) : (
                <View style={styles.noLogsContainer}>
                  <Ionicons name="document-text-outline" size={24} color="#BDBDBD" />
                  <Text style={styles.noLogs}>No recent logs</Text>
                </View>
              )}
            </Animated.View>
          </>
        )}
      </ScrollView>
      
      <Animated.View
        style={[
          styles.footer,
          { 
            opacity: fadeAnim,
            transform: [{ 
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })
            }]
          }
        ]}
      >
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#424242',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerDate: {
    fontSize: 12,
    color: '#757575',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  systemLabel: {
    color: '#757575',
    marginRight: 10,
    fontSize: 12,
    fontWeight: '500',
  },
  systemSwitch: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  systemText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#E8F5E9',
  },
  tabText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4CAF50',
  },
  calendarContainer: {
    position: 'absolute',
    top: 90,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  closeCalendarButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    alignSelf: 'center',
  },
  closeCalendarText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: '#757575',
    fontSize: 14,
  },
  summaryCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },
  totalCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalCountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
  },
  collectionDate: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },
  totalCountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4CAF50',
  },
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 10,
    paddingLeft: 4,
  },
  countCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  countCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  countCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  countCardLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#757575',
  },
  countCardValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#424242',
  },
  qualityCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  qualityCard: {
    backgroundColor: '#FFFFFF',
  },
  chartCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 8,
    marginVertical: 8,
  },
  logsCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logsTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  logIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logMessage: {
    flex: 1,
    fontSize: 14,
    color: '#424242',
  },
  logTime: {
    fontSize: 12,
    color: '#9E9E9E',
    marginLeft: 8,
  },
  noLogsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noLogs: {
    marginTop: 8,
    textAlign: 'center',
    color: '#9E9E9E',
  },
  footer: {
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logoutButton: {
    backgroundColor: '#757575',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  dateRangePicker: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#EEEEEE',
    borderRadius: 24,
    padding: 4,
  },
  dateRangeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeDateRange: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dateRangeText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  activeDateRangeText: {
    color: '#4CAF50',
  },
  trendSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  trendMetric: {
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
    marginBottom: 4,
  },
  trendValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#424242',
  },
  historyCards: {
    marginHorizontal: 16,
  },
  historyMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historySizeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sizeBarContainer: {
    height: 100,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  sizeBar: {
    width: 12,
    borderRadius: 6,
  },
  sizeLegend: {
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    color: '#757575',
  },
  historyQualityCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  historyQualityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#424242',
    marginBottom: 16,
    textAlign: 'center',
  },
  historyQualityStats: {
    justifyContent: 'center',
  },
  qualityStat: {
    marginBottom: 12,
    alignItems: 'center',
  },
  qualityStatLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  qualityStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
  },
  previousCollectionsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  previousCollectionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 12,
  },
  previousCollectionsScroll: {
    marginBottom: 8,
  },
  previousCollectionDay: {
    width: 140,
    borderRadius: 10,
    padding: 16,
    marginRight: 12,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  previousCollectionDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#757575',
    marginBottom: 8,
  },
  prevCollectionCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  prevCollectionTotal: {
    fontSize: 20,
    fontWeight: '600',
    color: '#424242',
    marginLeft: 8,
  },
  prevCollectionSizes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  prevCollectionSize: {
    alignItems: 'center',
  },
  prevCollectionSizeLabel: {
    fontSize: 10,
    color: '#9E9E9E',
    marginBottom: 2,
  },
  prevCollectionSizeValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#424242',
  },
});