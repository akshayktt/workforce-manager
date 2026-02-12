import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoading: authLoading, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    console.log('[Login] Auth state changed - user:', user?.username, 'role:', user?.role, 'authLoading:', authLoading);
    if (user && !authLoading) {
      console.log('[Login] User authenticated, navigating by role:', user.role);
      navigateByRole(user.role);
    }
  }, [user, authLoading]);

  function navigateByRole(role: string) {
    console.log('[Login] Navigating by role:', role);
    if (role === "admin") {
      console.log('[Login] Redirecting to /admin');
      router.replace("/admin");
    } else if (role === "supervisor") {
      console.log('[Login] Redirecting to /supervisor');
      router.replace("/supervisor");
    } else {
      console.log('[Login] Redirecting to /labor');
      router.replace("/labor");
    }
  }

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    console.log('[LoginUI] Starting login for username:', username.trim());
    setIsLoading(true);
    setError("");

    try {
      console.log('[LoginUI] Calling auth.login()');
      await login(username.trim(), password.trim());
      console.log('[LoginUI] Login completed successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      console.error('[LoginUI] Login failed:', e);
      console.error('[LoginUI] Error message:', e.message);
      const errorMsg = e.message?.includes("401") ? "Invalid credentials" : "Login failed. Please try again.";
      console.log('[LoginUI] Setting error message:', errorMsg);
      setError(errorMsg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
      console.log('[LoginUI] Login process finished');
    }
  }

  if (authLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.primary }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (user) return null;

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  return (
    <LinearGradient
      colors={[Colors.primaryDark, Colors.primary, Colors.primaryLight]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={[
            styles.container,
            {
              paddingTop: (insets.top || webTopInset) + 40,
              paddingBottom: (insets.bottom || webBottomInset) + 20,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="construct" size={36} color={Colors.primary} />
            </View>
            <Text style={styles.appTitle}>WorkForce</Text>
            <Text style={styles.subtitle}>Project & Labor Management</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>

            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={Colors.textTertiary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor={Colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.textTertiary} />
              </Pressable>
            </View>

            <Pressable
              onPress={handleLogin}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.loginButton,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                isLoading && { opacity: 0.7 },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Demo Accounts</Text>
            <View style={styles.demoGrid}>
              <DemoChip label="Admin" username="admin" password="password123" onPress={(u, p) => { setUsername(u); setPassword(p); }} />
              <DemoChip label="Supervisor" username="supervisor1" password="password123" onPress={(u, p) => { setUsername(u); setPassword(p); }} />
              <DemoChip label="Labor" username="labor1" password="password123" onPress={(u, p) => { setUsername(u); setPassword(p); }} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function DemoChip({
  label,
  username,
  password,
  onPress,
}: {
  label: string;
  username: string;
  password: string;
  onPress: (u: string, p: string) => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(username, password);
      }}
      style={({ pressed }) => [styles.demoChip, pressed && { opacity: 0.8 }]}
    >
      <Text style={styles.demoChipText}>{label}</Text>
      <Text style={styles.demoChipSub}>{username}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.danger,
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  inputIcon: {
    marginLeft: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  demoSection: {
    marginTop: 28,
    alignItems: "center",
  },
  demoTitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.6)",
    marginBottom: 12,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  demoGrid: {
    flexDirection: "row",
    gap: 10,
  },
  demoChip: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  demoChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  demoChipSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
});
