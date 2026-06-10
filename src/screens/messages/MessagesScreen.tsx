import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Text } from "@/src/components/Text";
import { UserAvatar } from "@/src/components/UserAvatar";
import { ArrowLeft2 } from "iconsax-react-native";
import { useMessages } from "@/src/query/hooks/use-message-queries";
import type { AppMessageListItem } from "@/src/api-contracts";
import { formatMessageTime } from "@/src/lib/format-message-time";

type Tab = "all" | "unread";

/**
 * Messages screen showing list of messages with tabs for all/unread
 */
export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const { data, isPending, refetch } = useMessages(activeTab);
  const [refreshing, setRefreshing] = useState(false);

  // Refetch when screen regains focus (e.g. back from detail after read-mark)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Only show spinner on very first load (no cached data at all)
  const showSpinner = isPending && !data;
  const messages = data?.items ?? [];

  const handlePressMessage = useCallback(
    (messageId: string) => {
      router.push(`/messages/${messageId}` as never);
    },
    [router],
  );

  const renderMessage = useCallback(
    ({ item }: { item: AppMessageListItem }) => (
      <Pressable
        style={styles.messageItem}
        onPress={() => handlePressMessage(item.id)}
      >
        <UserAvatar
          uri={item.senderAvatar}
          size={42}
          fallbackBackground="#238AAF"
        />
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={styles.senderName}>{item.senderName}</Text>
            <Text style={styles.dotSeparator}>·</Text>
            <Text style={styles.messageTime}>
              {formatMessageTime(item.createdAt)}
            </Text>
          </View>
          <Text style={styles.messageText} numberOfLines={1}>
            {item.contentPreview}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {item.unreadCount > 99 ? "99+" : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    ),
    [handlePressMessage],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={16}
        >
          <ArrowLeft2 size={20} color="#FFFFFF" variant="Linear" />
        </Pressable>
        <Text style={styles.headerTitle}>메시지</Text>
      </View>

      {/* Content */}
      <View style={[styles.content, { paddingBottom: insets.bottom }]}>
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tab, activeTab === "all" && styles.tabActive]}
            onPress={() => setActiveTab("all")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "all" && styles.tabTextActive,
              ]}
            >
              전체
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === "unread" && styles.tabActive]}
            onPress={() => setActiveTab("unread")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "unread" && styles.tabTextActive,
              ]}
            >
              읽지 않음
            </Text>
          </Pressable>
        </View>

        {/* Message List — only show full-screen spinner on initial load, not background refetch */}
        {showSpinner ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#238AAF" />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === "unread"
                ? "읽지 않은 메시지가 없습니다."
                : "메시지가 없습니다."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            style={styles.messageList}
            contentContainerStyle={[styles.messageListContent, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#238AAF"
              />
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#238AAF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 16,
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.528,
  },
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#238AAF",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8D8D8D",
    letterSpacing: -0.308,
  },
  tabTextActive: {
    color: "#238AAF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#8D8D8D",
    letterSpacing: -0.308,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  messageItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  messageContent: {
    flex: 1,
    gap: 2,
    position: "relative",
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  senderName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#151515",
    letterSpacing: -0.308,
  },
  dotSeparator: {
    fontSize: 12,
    color: "#8D8D8D",
    marginHorizontal: 2,
  },
  messageTime: {
    fontSize: 12,
    fontWeight: "400",
    color: "#454545",
    letterSpacing: -0.264,
  },
  messageText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#151515",
    letterSpacing: -0.308,
  },
  unreadBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FF3337",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.242,
  },
});
