import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Platform,
  Modal,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { apiRequest, queryClient, getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";

interface LaborUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
  skills: string[];
  nextAvailableDate?: string;
}

interface DatePickerWebProps {
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
  minDate?: Date;
}

function DatePickerWeb({ selectedDate, onDateChange, minDate }: DatePickerWebProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selectedDate || new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const days: (number | null)[] = [];
  const firstDay = getFirstDayOfMonth(currentMonth);
  const daysInMonth = getDaysInMonth(currentMonth);

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const isDateDisabled = (day: number) => {
    if (!minDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date < minDate;
  };

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return (
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate()
    );
  };

  const handleDayPress = (day: number) => {
    if (!isDateDisabled(day)) {
      const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      onDateChange(newDate);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <View style={styles.datePickerContainer}>
      <View style={styles.calendarHeader}>
        <Pressable onPress={goToPreviousMonth}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </Pressable>
        <Text style={styles.calendarTitle}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        <Pressable onPress={goToNextMonth}>
          <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
        </Pressable>
      </View>

      <View style={styles.weekDays}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
          <Text key={idx} style={styles.weekDay}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {days.map((day, idx) => (
          <Pressable
            key={idx}
            onPress={() => day !== null && handleDayPress(day)}
            style={[
              styles.dayCell,
              day === null && styles.dayCellEmpty,
              day !== null &&
                isDateDisabled(day) &&
                styles.dayCellDisabled,
              day !== null &&
                isDateSelected(day) &&
                styles.dayCellSelected,
            ]}
            disabled={day === null || (day !== null && isDateDisabled(day))}
          >
            {day !== null && (
              <Text
                style={[
                  styles.dayText,
                  isDateDisabled(day) && styles.dayTextDisabled,
                  isDateSelected(day) && styles.dayTextSelected,
                ]}
              >
                {day}
              </Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function RequestLaborScreen() {
  const { projectId, projectName } = useLocalSearchParams<{ projectId: string; projectName: string }>();
  const [selectedLabor, setSelectedLabor] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBy, setSearchBy] = useState<"username" | "skill">("username");

  const searchParam = searchQuery.trim();
  const queryKey = searchParam
    ? ["/api/users/labor", `?search=${searchParam}&searchBy=${searchBy}`]
    : ["/api/users/labor"];

  const { data: laborers = [], isLoading, isFetching } = useQuery<LaborUser[]>({
    queryKey,
    queryFn: async () => {
      const baseUrl = getApiUrl();
      let url: string;
      if (searchParam) {
        url = new URL(`/api/users/labor?search=${encodeURIComponent(searchParam)}&searchBy=${searchBy}`, baseUrl).toString();
      } else {
        url = new URL("/api/users/labor", baseUrl).toString();
      }
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      const laborersData: LaborUser[] = await res.json();
      
      // Fetch availability for each laborer
      const laborersWithAvailability = await Promise.all(
        laborersData.map(async (laborer) => {
          try {
            const schedUrl = new URL(`/api/labor-scheduled/${laborer.id}`, baseUrl).toString();
            const schedRes = await fetch(schedUrl, { credentials: "include" });
            if (schedRes.ok) {
              const { scheduledRanges } = await schedRes.json();
              
              // Calculate next available date
              if (scheduledRanges && scheduledRanges.length > 0) {
                const sorted = scheduledRanges.sort((a: any, b: any) => 
                  new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                );
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                // Find first available gap
                let nextAvailableDate: Date | null = null;
                
                if (new Date(sorted[0].startDate) > today) {
                  nextAvailableDate = today;
                } else {
                  for (let i = 0; i < sorted.length - 1; i++) {
                    const gapStart = new Date(sorted[i].endDate);
                    gapStart.setDate(gapStart.getDate() + 1);
                    if (gapStart > today) {
                      nextAvailableDate = gapStart;
                      break;
                    }
                  }
                  if (!nextAvailableDate) {
                    const lastEnd = new Date(sorted[sorted.length - 1].endDate);
                    lastEnd.setDate(lastEnd.getDate() + 1);
                    nextAvailableDate = lastEnd;
                  }
                }
                
                return {
                  ...laborer,
                  nextAvailableDate: nextAvailableDate.toLocaleDateString("en-US", { 
                    month: "short", 
                    day: "numeric", 
                    year: "numeric" 
                  }),
                };
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch availability for laborer ${laborer.id}`);
          }
          return laborer;
        })
      );
      
      return laborersWithAvailability;
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!startDate || !endDate) {
        throw new Error("Please select both start and end dates");
      }
      
      await apiRequest("POST", "/api/labor-requests", {
        projectId,
        laborId: selectedLabor,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/labor-requests"] });
      router.back();
    },
    onError: (e: any) => {
      e.json().then((errData: any) => {
        const msg = errData.message || "Failed to create request";
        setError(msg.includes("409") ? "This worker is already scheduled during that period" : msg);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      });
    }
  });

  function handleSubmit() {
    if (!selectedLabor) {
      setError("Please select a worker");
      return;
    }
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }
    if (endDate <= startDate) {
      setError("End date must be after start date");
      return;
    }

    setError("");
    mutation.mutate();
  }

  function handleToggle(mode: "username" | "skill") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchBy(mode);
    setSearchQuery("");
    setSelectedLabor(null);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Request Labor</Text>

      <View style={styles.projectInfo}>
        <Ionicons name="folder-outline" size={18} color={Colors.primary} />
        <Text style={styles.projectName}>{projectName || "Project"}</Text>
      </View>

      {!!error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.searchByContainer}>
        <Text style={styles.searchByLabel}>Search By:</Text>
        <View style={styles.toggleSwitch}>
          <Pressable
            onPress={() => handleToggle("username")}
            style={[
              styles.toggleSwitchOption,
              searchBy === "username" && styles.toggleSwitchActive,
            ]}
          >
            <Ionicons
              name="person-outline"
              size={14}
              color={searchBy === "username" ? "#fff" : Colors.textSecondary}
            />
            <Text
              style={[
                styles.toggleSwitchText,
                searchBy === "username" && styles.toggleSwitchTextActive,
              ]}
            >
              Username
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleToggle("skill")}
            style={[
              styles.toggleSwitchOption,
              searchBy === "skill" && styles.toggleSwitchActive,
            ]}
          >
            <Ionicons
              name="construct-outline"
              size={14}
              color={searchBy === "skill" ? "#fff" : Colors.textSecondary}
            />
            <Text
              style={[
                styles.toggleSwitchText,
                searchBy === "skill" && styles.toggleSwitchTextActive,
              ]}
            >
              Skill
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={Colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={searchBy === "username" ? "Search by name or username..." : "Search by skill (e.g. Carpentry)..."}
          placeholderTextColor={Colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {!!searchQuery && (
          <Pressable
            onPress={() => {
              setSearchQuery("");
              setSelectedLabor(null);
            }}
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
          </Pressable>
        )}
        {isFetching && <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 10 }} />}
      </View>

      <Text style={styles.label}>
        {searchParam ? `Results (${laborers.length})` : `All Workers (${laborers.length})`}
      </Text>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
      ) : laborers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={32} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>
            {searchParam
              ? `No workers found matching "${searchParam}"`
              : "No workers available"}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.laborListContainer} scrollEnabled={true}>
          <View style={styles.laborList}>
            {laborers.map((l) => (
            <Pressable
              key={l.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedLabor(l.id);
              }}
              style={[styles.laborItem, selectedLabor === l.id && styles.laborItemSelected]}
            >
              <View style={[styles.laborAvatar, selectedLabor === l.id && styles.laborAvatarSelected]}>
                <Ionicons
                  name="person"
                  size={18}
                  color={selectedLabor === l.id ? "#fff" : Colors.textTertiary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.laborName, selectedLabor === l.id && styles.laborNameSelected]}>
                  {l.fullName}
                </Text>
                <Text style={styles.laborUsername}>@{l.username}</Text>
                {l.skills && l.skills.length > 0 && (
                  <View style={styles.skillsRow}>
                    {l.skills.map((skill, i) => (
                      <View
                        key={i}
                        style={[
                          styles.skillChip,
                          searchBy === "skill" &&
                            searchParam &&
                            skill.toLowerCase().includes(searchParam.toLowerCase()) &&
                            styles.skillChipHighlighted,
                        ]}
                      >
                        <Text
                          style={[
                            styles.skillChipText,
                            searchBy === "skill" &&
                              searchParam &&
                              skill.toLowerCase().includes(searchParam.toLowerCase()) &&
                              styles.skillChipTextHighlighted,
                          ]}
                        >
                          {skill}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                {l.nextAvailableDate && (
                  <Text style={styles.availabilityText}>
                    ⏱️ Available from {l.nextAvailableDate}
                  </Text>
                )}
              </View>
              {selectedLabor === l.id && (
                <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
              )}
            </Pressable>
          ))}
          </View>
        </ScrollView>
      )}

      <Text style={[styles.label, { marginTop: 16 }]}>Start Date</Text>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowStartDatePicker(true);
        }}
        style={({ pressed }) => [styles.dateButton, pressed && { opacity: 0.7 }]}
      >
        <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
        <Text style={styles.dateButtonText}>
          {startDate ? startDate.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" }) : "Select start date"}
        </Text>
      </Pressable>

      <Modal
        transparent
        visible={showStartDatePicker}
        animationType="slide"
        onRequestClose={() => setShowStartDatePicker(false)}
      >
        <View style={styles.datePickerModal}>
          <View style={styles.datePickerHeader}>
            <Pressable onPress={() => setShowStartDatePicker(false)}>
              <Text style={styles.datePickerCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.datePickerTitle}>Select Start Date</Text>
            <Pressable
              onPress={() => {
                setShowStartDatePicker(false);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
            >
              <Text style={styles.datePickerDone}>Done</Text>
            </Pressable>
          </View>
          <DatePickerWeb
            selectedDate={startDate}
            onDateChange={setStartDate}
            minDate={new Date()}
          />
        </View>
      </Modal>

      <Text style={styles.label}>End Date</Text>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowEndDatePicker(true);
        }}
        style={({ pressed }) => [styles.dateButton, pressed && { opacity: 0.7 }]}
      >
        <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
        <Text style={styles.dateButtonText}>
          {endDate ? endDate.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" }) : "Select end date"}
        </Text>
      </Pressable>

      <Modal
        transparent
        visible={showEndDatePicker}
        animationType="slide"
        onRequestClose={() => setShowEndDatePicker(false)}
      >
        <View style={styles.datePickerModal}>
          <View style={styles.datePickerHeader}>
            <Pressable onPress={() => setShowEndDatePicker(false)}>
              <Text style={styles.datePickerCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.datePickerTitle}>Select End Date</Text>
            <Pressable
              onPress={() => {
                setShowEndDatePicker(false);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
            >
              <Text style={styles.datePickerDone}>Done</Text>
            </Pressable>
          </View>
          <DatePickerWeb
            selectedDate={endDate}
            onDateChange={setEndDate}
            minDate={startDate || new Date()}
          />
        </View>
      </Modal>

      <Pressable
        onPress={handleSubmit}
        disabled={mutation.isPending}
        style={({ pressed }) => [
          styles.submitBtn,
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          mutation.isPending && { opacity: 0.6 },
        ]}
      >
        {mutation.isPending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.submitBtnText}>Submit Request</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    flexGrow: 0,
    flex: 1,
    padding: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 10,
  },
  projectInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: "center",
  },
  projectName: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.danger,
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 8,
  },
  searchByContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  searchByLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  toggleSwitch: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 20,
    padding: 3,
    gap: 4,
  },
  toggleSwitchOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  toggleSwitchActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleSwitchText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  toggleSwitchTextActive: {
    color: "#fff",
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  toggleOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 6,
    height: 40,
  },
  searchIcon: {
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 6,
    flex: 1,
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
    textAlign: "center",
  },
  laborListContainer: {
    height: "50%",
    minHeight: 150,
    maxHeight: 300,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  laborList: {
    gap: 6,
  },
  laborItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  laborItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.accentLight,
  },
  laborAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  laborAvatarSelected: {
    backgroundColor: Colors.primary,
  },
  laborName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  laborNameSelected: {
    color: Colors.primary,
  },
  laborUsername: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
  availabilityText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.danger,
    marginTop: 4,
  },
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 6,
  },
  skillChip: {
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  skillChipHighlighted: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accent,
  },
  skillChipText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  skillChipTextHighlighted: {
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 8,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 6,
    height: 40,
  },
  dateButtonText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
    flex: 1,
  },
  datePickerModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  datePickerTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  datePickerCancel: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.danger,
  },
  datePickerDone: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  datePickerContainer: {
    backgroundColor: Colors.surface,
    maxHeight: 400,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  calendarTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  weekDays: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 4,
  },
  dayCellEmpty: {
    backgroundColor: "transparent",
  },
  dayCellDisabled: {
    opacity: 0.4,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  dayTextDisabled: {
    color: Colors.textTertiary,
  },
  dayTextSelected: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
  },
});
