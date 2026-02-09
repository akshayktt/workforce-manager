import React from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";

interface LaborRequestEnriched {
  id: string;
  projectId: string;
  laborId: string;
  supervisorId: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  projectName: string;
  laborName: string;
  supervisorName: string;
}

export default function LaborDashboard() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const { data: requests = [], isLoading, refetch } = useQuery<LaborRequestEnriched[]>({
    queryKey: ["/api/labor-requests"],
  });

  const activeAssignments = requests.filter((r) => r.status === "approved");
  const pendingAssignments = requests.filter((r) => r.status === "pending");

  async function handleLogout() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await logout();
    router.replace("/");
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getDaysRemaining(endDate: string) {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  const allItems = [
    ...activeAssignments.map((r) => ({ ...r, section: "active" as const })),
    ...pendingAssignments.map((r) => ({ ...r, section: "pending" as const })),
  ];

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: (insets.top || webTopInset) + 8,
          paddingBottom: insets.bottom || webBottomInset,
        },
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.fullName}</Text>
        </View>
        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <Feather name="log-out" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: Colors.success }]}>{activeAssignments.length}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: Colors.warning }]}>{pendingAssignments.length}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: Colors.primary }]}>{requests.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : allItems.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={56} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>No assignments yet</Text>
          <Text style={styles.emptySubtext}>Your scheduled projects will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={allItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={Colors.primary} />}
          renderItem={({ item, index }) => {
            const showSectionHeader =
              index === 0 ||
              allItems[index - 1].section !== item.section;

            return (
              <>
                {showSectionHeader && (
                  <Text style={styles.sectionTitle}>
                    {item.section === "active" ? "Active Assignments" : "Pending Approval"}
                  </Text>
                )}
                <View style={[styles.assignmentCard, item.section === "active" && styles.activeCard]}>
                  <View style={styles.cardTop}>
                    <View style={[styles.statusDot, { backgroundColor: item.section === "active" ? Colors.success : Colors.warning }]} />
                    <Text style={styles.projectName}>{item.projectName}</Text>
                    {item.section === "active" && (
                      <View style={styles.daysBadge}>
                        <Text style={styles.daysText}>
                          {getDaysRemaining(item.endDate) > 0
                            ? `${getDaysRemaining(item.endDate)}d left`
                            : "Ended"}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="person-outline" size={16} color={Colors.textTertiary} />
                      <Text style={styles.detailLabel}>Supervisor</Text>
                      <Text style={styles.detailValue}>{item.supervisorName}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={16} color={Colors.textTertiary} />
                      <Text style={styles.detailLabel}>Start</Text>
                      <Text style={styles.detailValue}>{formatDate(item.startDate)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={16} color={Colors.textTertiary} />
                      <Text style={styles.detailLabel}>End</Text>
                      <Text style={styles.detailValue}>{formatDate(item.endDate)}</Text>
                    </View>
                  </View>

                  {item.section === "active" && (
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(100, Math.max(5, calculateProgress(item.startDate, item.endDate)))}%`,
                          },
                        ]}
                      />
                    </View>
                  )}
                </View>
              </>
            );
          }}
        />
      )}
    </View>
  );
}

function calculateProgress(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const total = end - start;
  const elapsed = now - start;
  return (elapsed / total) * 100;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  name: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text },
  logoutBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryCount: { fontSize: 28, fontFamily: "Inter_700Bold" },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: Colors.borderLight },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 },
  emptyText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.textTertiary },
  emptySubtext: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textTertiary },
  listContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  assignmentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  activeCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  projectName: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  daysBadge: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  daysText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  cardDetails: { gap: 8, marginBottom: 12 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textTertiary, width: 80 },
  detailValue: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.text, flex: 1 },
  progressBar: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.success,
    borderRadius: 2,
  },
});
