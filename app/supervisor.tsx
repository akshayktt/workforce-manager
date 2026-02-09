import React, { useState, useEffect } from "react";
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

interface Project {
  id: string;
  name: string;
  description: string | null;
  supervisorId: string;
  createdAt: string;
}

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

export default function SupervisorDashboard() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [view, setView] = useState<"projects" | "requests">("projects");

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const { data: projects = [], isLoading: projectsLoading, refetch: refetchProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: requests = [], isLoading: requestsLoading, refetch: refetchRequests } = useQuery<LaborRequestEnriched[]>({
    queryKey: ["/api/labor-requests"],
  });

  // Refetch data when user changes (handles supervisor switching)
  useEffect(() => {
    if (user?.id) {
      refetchProjects();
      refetchRequests();
    }
  }, [user?.id, refetchProjects, refetchRequests]);

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

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="folder-open-outline" size={22} color={Colors.primary} />
          <Text style={[styles.statCount, { color: Colors.primary }]}>{projects.length}</Text>
          <Text style={styles.statLabel}>Projects</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={22} color={Colors.warning} />
          <Text style={[styles.statCount, { color: Colors.warning }]}>
            {requests.filter((r) => r.status === "pending").length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={22} color={Colors.success} />
          <Text style={[styles.statCount, { color: Colors.success }]}>
            {requests.filter((r) => r.status === "approved").length}
          </Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        <Pressable
          onPress={() => setView("projects")}
          style={[styles.tab, view === "projects" && styles.tabActive]}
        >
          <Ionicons name="folder-outline" size={16} color={view === "projects" ? "#fff" : Colors.textSecondary} />
          <Text style={[styles.tabText, view === "projects" && styles.tabTextActive]}>Projects</Text>
        </Pressable>
        <Pressable
          onPress={() => setView("requests")}
          style={[styles.tab, view === "requests" && styles.tabActive]}
        >
          <Ionicons name="people-outline" size={16} color={view === "requests" ? "#fff" : Colors.textSecondary} />
          <Text style={[styles.tabText, view === "requests" && styles.tabTextActive]}>Requests</Text>
        </Pressable>
      </View>

      {view === "projects" ? (
        <>
          {projectsLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : projects.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="folder-open-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No projects yet</Text>
              <Text style={styles.emptySubtext}>Create your first project to get started</Text>
            </View>
          ) : (
            <FlatList
              data={projects}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={false} onRefresh={refetchProjects} tintColor={Colors.primary} />}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.projectCard, pressed && { opacity: 0.95 }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: "/request-labor", params: { projectId: item.id, projectName: item.name } });
                  }}
                >
                  <View style={styles.projectIcon}>
                    <Ionicons name="cube-outline" size={22} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.projectName}>{item.name}</Text>
                    {item.description ? (
                      <Text style={styles.projectDesc} numberOfLines={1}>{item.description}</Text>
                    ) : null}
                    <Text style={styles.projectDate}>
                      Created {formatDate(item.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.requestLaborBadge}>
                    <Ionicons name="person-add-outline" size={14} color={Colors.primary} />
                  </View>
                </Pressable>
              )}
            />
          )}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/add-project");
            }}
            style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.95 }] }]}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </Pressable>
        </>
      ) : (
        <>
          {requestsLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : requests.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="people-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No requests yet</Text>
              <Text style={styles.emptySubtext}>Request labor from a project</Text>
            </View>
          ) : (
            <FlatList
              data={requests}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={false} onRefresh={refetchRequests} tintColor={Colors.primary} />}
              renderItem={({ item }) => (
                <View style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View style={styles.projectBadge}>
                      <Ionicons name="folder-outline" size={14} color={Colors.primary} />
                      <Text style={styles.projectBadgeText}>{item.projectName}</Text>
                    </View>
                    <StatusBadge status={item.status} />
                  </View>
                  <View style={styles.requestDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="person-outline" size={16} color={Colors.textTertiary} />
                      <Text style={styles.detailLabel}>Labor</Text>
                      <Text style={styles.detailValue}>{item.laborName}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={16} color={Colors.textTertiary} />
                      <Text style={styles.detailLabel}>Period</Text>
                      <Text style={styles.detailValue}>{formatDate(item.startDate)} - {formatDate(item.endDate)}</Text>
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </>
      )}
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { bg: "#FEF3CD", color: "#856404" },
    approved: { bg: "#D4EDDA", color: "#155724" },
    rejected: { bg: "#F8D7DA", color: "#721C24" },
  }[status] || { bg: "#eee", color: "#666" };

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
      <Text style={[styles.statusText, { color: config.color }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
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
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginVertical: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statCount: { fontSize: 24, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  tabTextActive: { color: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 },
  emptyText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.textTertiary },
  emptySubtext: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textTertiary },
  listContent: { paddingHorizontal: 20, paddingBottom: 100, gap: 12 },
  projectCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  projectIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.accentLight,
    justifyContent: "center",
    alignItems: "center",
  },
  projectName: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.text },
  projectDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  projectDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textTertiary, marginTop: 4 },
  requestLaborBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.accentLight,
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  requestCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  projectBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  projectBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  requestDetails: { gap: 8 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textTertiary, width: 60 },
  detailValue: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.text, flex: 1 },
});
