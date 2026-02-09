import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient, getQueryFn } from "@/lib/query-client";

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
  laborSkills: string[];
  supervisorName: string;
}

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userType, setUserType] = useState<"supervisor" | "labor" | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    skills: "",
  });

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const { data: requests = [], isLoading, refetch } = useQuery<LaborRequestEnriched[]>({
    queryKey: ["/api/labor-requests"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  console.log("[AdminDashboard] Current requests:", requests.length, "Loading:", isLoading);

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      console.log(`[updateMutation] Approving request ${id} with status ${status}`);
      const res = await apiRequest("PATCH", `/api/labor-requests/${id}`, { status });
      const data = await res.json();
      console.log(`[updateMutation] Response:`, data);
      return data;
    },
    onSuccess: () => {
      console.log("[updateMutation] Success! Invalidating queries");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/labor-requests"] });
    },
    onError: (error: any) => {
      console.error("[updateMutation] Error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      alert(`Failed to update: ${error.message}`);
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const skillsArray = userType === "labor" ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

      const res = await apiRequest("POST", "/api/users/create", {
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        role: userType,
        skills: skillsArray,
      });
      return res.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      alert(`${userType === "labor" ? "Labor" : "Supervisor"} created successfully!`);
      setShowCreateModal(false);
      setUserType(null);
      setFormData({ username: "", password: "", fullName: "", skills: "" });
      // Optionally refetch data if needed
    },
    onError: (error) => {
      console.error("Create user failed:", error);
      alert(`Failed to create user: ${error.message}`);
    },
  });

  const filteredRequests = requests.filter((r) => r.status === activeTab);

  function handleAction(id: string, status: "approved" | "rejected") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log(`[handleAction] User clicked to ${status} request ${id}`);
    updateMutation.mutate({ id, status });
  }

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

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

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
        <View style={styles.headerButtons}>
          <Pressable onPress={() => setShowCreateModal(true)} style={styles.addBtn}>
            <Ionicons name="add" size={20} color={Colors.primary} />
          </Pressable>
          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <Feather name="log-out" size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard count={pendingCount} label="Pending" color={Colors.warning} icon="time-outline" />
        <StatCard count={approvedCount} label="Approved" color={Colors.success} icon="checkmark-circle-outline" />
        <StatCard count={rejectedCount} label="Rejected" color={Colors.danger} icon="close-circle-outline" />
      </View>

      <View style={styles.tabBar}>
        <TabButton label="Pending" active={activeTab === "pending"} count={pendingCount} onPress={() => setActiveTab("pending")} />
        <TabButton label="Approved" active={activeTab === "approved"} count={approvedCount} onPress={() => setActiveTab("approved")} />
        <TabButton label="Rejected" active={activeTab === "rejected"} count={rejectedCount} onPress={() => setActiveTab("rejected")} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : filteredRequests.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="document-text-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>No {activeTab} requests</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={Colors.primary} />}
          renderItem={({ item }) => (
            <RequestCard
              item={item}
              activeTab={activeTab}
              onApprove={() => handleAction(item.id, "approved")}
              onReject={() => handleAction(item.id, "rejected")}
              formatDate={formatDate}
              isProcessing={updateMutation.isPending}
            />
          )}
        />
      )}

      <CreateUserModal
        visible={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setUserType(null);
          setFormData({ username: "", password: "", fullName: "", skills: "" });
        }}
        userType={userType}
        setUserType={setUserType}
        formData={formData}
        setFormData={setFormData}
        onSubmit={() => createUserMutation.mutate()}
        isLoading={createUserMutation.isPending}
      />
    </View>
  );
}

function StatCard({ count, label, color, icon }: { count: number; label: string; color: string; icon: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={[styles.statCount, { color }]}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TabButton({ label, active, count, onPress }: { label: string; active: boolean; count: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
      {count > 0 && (
        <View style={[styles.badge, active && styles.badgeActive]}>
          <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
}

function RequestCard({
  item,
  activeTab,
  onApprove,
  onReject,
  formatDate,
  isProcessing,
}: {
  item: LaborRequestEnriched;
  activeTab: string;
  onApprove: () => void;
  onReject: () => void;
  formatDate: (s: string) => string;
  isProcessing: boolean;
}) {
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.projectBadge}>
          <Ionicons name="folder-outline" size={14} color={Colors.primary} />
          <Text style={styles.projectName}>{item.projectName}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.requestDetails}>
        <DetailRow icon="person-outline" label="Labor" value={item.laborName} />
        {item.laborSkills && item.laborSkills.length > 0 && (
          <View style={styles.skillsRow}>
            <Ionicons name="construct-outline" size={16} color={Colors.textTertiary} />
            <Text style={styles.detailLabel}>Skills</Text>
            <View style={styles.skillChips}>
              {item.laborSkills.map((skill, i) => (
                <View key={i} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        <DetailRow icon="briefcase-outline" label="Supervisor" value={item.supervisorName} />
        <DetailRow icon="calendar-outline" label="Period" value={`${formatDate(item.startDate)} - ${formatDate(item.endDate)}`} />
      </View>

      {activeTab === "pending" && (
        <View style={styles.actionRow}>
          <Pressable
            onPress={onReject}
            disabled={isProcessing}
            style={({ pressed }) => [styles.rejectBtn, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="close" size={18} color={Colors.danger} />
            <Text style={styles.rejectText}>Reject</Text>
          </Pressable>
          <Pressable
            onPress={onApprove}
            disabled={isProcessing}
            style={({ pressed }) => [styles.approveBtn, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={styles.approveText}>Approve</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon as any} size={16} color={Colors.textTertiary} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function CreateUserModal({
  visible,
  onClose,
  userType,
  setUserType,
  formData,
  setFormData,
  onSubmit,
  isLoading,
}: {
  visible: boolean;
  onClose: () => void;
  userType: "supervisor" | "labor" | null;
  setUserType: (type: "supervisor" | "labor") => void;
  formData: { username: string; password: string; fullName: string; skills: string };
  setFormData: (data: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New User</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>

          {!userType ? (
            <View style={styles.typeSelection}>
              <Text style={styles.typeLabel}>Select User Type</Text>
              <Pressable
                onPress={() => setUserType("supervisor")}
                style={styles.typeBtn}
              >
                <Ionicons name="person-outline" size={32} color={Colors.primary} />
                <Text style={styles.typeBtnText}>Add Supervisor</Text>
              </Pressable>
              <Pressable
                onPress={() => setUserType("labor")}
                style={styles.typeBtn}
              >
                <Ionicons name="briefcase-outline" size={32} color={Colors.success} />
                <Text style={styles.typeBtnText}>Add Labor</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter username"
                  value={formData.username}
                  onChangeText={(text) => setFormData({ ...formData, username: text })}
                  editable={!isLoading}
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  secureTextEntry
                  editable={!isLoading}
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                  editable={!isLoading}
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>

              {userType === "labor" && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Skills (comma-separated)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="e.g., Carpentry, Plumbing, Electrical"
                    value={formData.skills}
                    onChangeText={(text) => setFormData({ ...formData, skills: text })}
                    multiline
                    editable={!isLoading}
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
              )}

              <View style={styles.formActions}>
                <Pressable
                  onPress={() => {
                    setUserType(null);
                    setFormData({ username: "", password: "", fullName: "", skills: "" });
                  }}
                  disabled={isLoading}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Back</Text>
                </Pressable>
                <Pressable
                  onPress={onSubmit}
                  disabled={
                    isLoading ||
                    !formData.username ||
                    !formData.password ||
                    !formData.fullName ||
                    (userType === "labor" && !formData.skills)
                  }
                  style={styles.submitBtn}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Create {userType === "labor" ? "Labor" : "Supervisor"}</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
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
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  tabTextActive: { color: "#fff" },
  badge: {
    backgroundColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: "center",
  },
  badgeActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  badgeTextActive: { color: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_500Medium", color: Colors.textTertiary },
  listContent: { paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  requestCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
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
  projectName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  requestDetails: { gap: 8, marginBottom: 12 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textTertiary, width: 80 },
  detailValue: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.text, flex: 1 },
  skillsRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  skillChips: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 4 },
  skillChip: {
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  skillChipText: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 12,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  rejectText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.danger },
  approveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.success,
  },
  approveText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.accentLight,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  typeSelection: {
    gap: 12,
  },
  typeLabel: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginBottom: 8,
  },
  typeBtn: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  typeBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  formContainer: {
    gap: 12,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  formActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});

