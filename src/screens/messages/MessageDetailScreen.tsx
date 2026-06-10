import React, { useMemo, useCallback, useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  TextInput,
  Keyboard,
  Platform,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Text } from "@/src/components/Text";
import { UserAvatar } from "@/src/components/UserAvatar";
import { ArrowLeft2, Send2 } from "iconsax-react-native";
import { useMessageDetail } from "@/src/query/hooks/use-message-queries";
import {
  useChatMessages,
  useSendChatMessage,
  useMarkChatAsRead,
} from "@/src/query/hooks/use-chat-queries";
import { useAuthStore } from "@/src/store/auth-store";
import { useAppModal } from "@/src/hooks/useAppModal";
import { formatMessageDate } from "@/src/lib/format-message-time";
import type { ChatMessageItem, AppMessageDetail } from "@/src/api-contracts";

/** Unified message type for rendering both broadcast and chat messages */
interface UnifiedMessage {
  id: string;
  content: string;
  createdAt: number;
  isMine: boolean;
  type: "broadcast" | "chat";
}

/** A date group containing a label and all messages for that day */
interface DateGroup {
  dateLabel: string;
  messages: UnifiedMessage[];
}

/**
 * Merge broadcast messages and chat messages into a unified sorted list
 */
function mergeMessages(
  broadcastMessages: AppMessageDetail[],
  chatMessages: ChatMessageItem[],
  currentUserId: string | null
): UnifiedMessage[] {
  // Use raw message ID as key to deduplicate across both sources
  const messageMap = new Map<string, UnifiedMessage>();

  // Add broadcast messages first
  for (const msg of broadcastMessages) {
    messageMap.set(msg.id, {
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt,
      isMine: false,
      type: "broadcast",
    });
  }

  // Chat messages override broadcast if same ID (chat has richer senderId info)
  for (const msg of chatMessages) {
    messageMap.set(msg.id, {
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt,
      isMine: msg.senderId === currentUserId,
      type: "chat",
    });
  }

  // Sort by createdAt ascending
  const unified = Array.from(messageMap.values());
  unified.sort((a, b) => a.createdAt - b.createdAt);
  return unified;
}

/**
 * Group messages by date label so each day only shows one header
 */
function groupMessagesByDate(messages: UnifiedMessage[]): DateGroup[] {
  const groups: DateGroup[] = [];
  let currentLabel = "";

  for (const msg of messages) {
    const label = formatMessageDate(msg.createdAt);
    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ dateLabel: label, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }

  return groups;
}

/**
 * Message detail screen showing conversation with a sender + chat reply input
 */
export default function MessageDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.userId);
  const { showModal } = useAppModal();

  const [inputValue, setInputValue] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Fetch broadcast messages (app messages from this sender)
  const { data: messageData, isLoading: isLoadingMessages } = useMessageDetail(id ?? null);

  const senderId = messageData?.senderId ?? null;
  const senderName = messageData?.senderName ?? "";
  const senderAvatar = messageData?.senderAvatar ?? null;
  const broadcastMessages = messageData?.messages ?? [];

  // Fetch chat messages with this admin (bidirectional)
  const { data: chatData } = useChatMessages(senderId);
  const chatMessages = chatData?.messages ?? [];

  // Send chat message mutation
  const sendMutation = useSendChatMessage(senderId ?? "");

  // Mark chat messages as read
  const markReadMutation = useMarkChatAsRead(senderId ?? "");

  // Mark chat messages as read when screen opens and senderId is available
  useEffect(() => {
    if (senderId) {
      markReadMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [senderId]);

  // Merge and group messages
  const unifiedMessages = useMemo(
    () => mergeMessages(broadcastMessages, chatMessages, userId),
    [broadcastMessages, chatMessages, userId]
  );

  const dateGroups = useMemo(() => groupMessagesByDate(unifiedMessages), [unifiedMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (dateGroups.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [dateGroups.length, unifiedMessages.length]);

  // Track keyboard visibility to reduce bottom padding when keyboard is open
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
      // Delay scroll so KeyboardAvoidingView finishes resizing the layout
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 300);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || sendMutation.isPending || !senderId) return;

    setInputValue("");

    try {
      await sendMutation.mutateAsync(content);
    } catch (error) {
      const apiError =
        error && typeof error === "object" && "apiError" in error
          ? (error as { apiError?: { message?: string } }).apiError
          : null;
      showModal({
        title: "에러",
        message: apiError?.message ?? "메시지 전송에 실패했습니다.",
        buttons: [{ text: "확인" }],
      });
    }
  }, [inputValue, sendMutation, senderId, showModal]);

  const isLoading = isLoadingMessages && !messageData;

  const renderDateGroup = ({ item }: { item: DateGroup }) => (
    <View style={styles.dateGroup}>
      <Text style={styles.dateLabel}>{item.dateLabel}</Text>
      {item.messages.map((msg) =>
        msg.isMine ? (
          <View key={msg.id} style={styles.myBubbleRow}>
            <View style={styles.myBubble}>
              <Text style={styles.myBubbleText}>{msg.content}</Text>
            </View>
          </View>
        ) : (
          <View key={msg.id} style={styles.messageBubble}>
            <Text style={styles.bubbleText}>{msg.content}</Text>
          </View>
        )
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header - stays fixed outside KeyboardAvoidingView */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={16}>
          <ArrowLeft2 size={20} color="#151515" variant="Linear" />
        </Pressable>
        <UserAvatar uri={senderAvatar} size={42} fallbackBackground="#238AAF" />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{senderName}</Text>
          <Text style={styles.headerStatus}>관리자</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Chat body + input: only this part reacts to keyboard */}
      <KeyboardAvoidingView style={styles.chatBody} behavior="padding">
        {/* Chat Messages */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#238AAF" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={dateGroups}
            keyExtractor={(item) => item.dateLabel}
            renderItem={renderDateGroup}
            style={styles.chatList}
            contentContainerStyle={styles.chatListContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={<View style={styles.listFooter} />}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }}
          />
        )}

        {/* Chat Input */}
        <View
          style={[
            styles.inputContainer,
            { paddingBottom: keyboardVisible ? 6 : Math.max(insets.bottom, 4) },
          ]}
        >
          <TextInput
            style={styles.textInput}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="내용을 입력해"
            placeholderTextColor="#A3A3A3"
            maxLength={1000}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!!senderId}
          />
          <Pressable
            style={[
              styles.sendButton,
              (!inputValue.trim() || sendMutation.isPending || !senderId) &&
                styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputValue.trim() || sendMutation.isPending || !senderId}
            hitSlop={10}
          >
            <Send2 size={24} color="#151515" variant="Linear" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  chatBody: {
    flex: 1,
  },
  backButton: {
    width: 20,
    height: 20,
  },
  headerInfo: {
    gap: 2,
  },
  headerName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#151515",
    letterSpacing: -0.308,
  },
  headerStatus: {
    fontSize: 12,
    fontWeight: "400",
    color: "#2D2D2D",
    letterSpacing: -0.264,
  },
  divider: {
    height: 1,
    backgroundColor: "#E9E9E9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    // gap: 12,
  },
  listFooter: {
    height: 12,
  },
  dateGroup: {
    gap: 6,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: "#454545",
    textAlign: "center",
    letterSpacing: -0.308,
  },
  messageBubble: {
    backgroundColor: "#F4F4F4",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 0,
    alignSelf: "flex-start",
    maxWidth: "80%",
  },
  bubbleText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#151515",
    letterSpacing: -0.308,
    lineHeight: 20,
  },
  myBubbleRow: {
    alignItems: "flex-end",
  },
  myBubble: {
    backgroundColor: "#C4EFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 0,
    maxWidth: "80%",
  },
  myBubbleText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#151515",
    letterSpacing: -0.308,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 36,
    backgroundColor: "#F2F2F2",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 0,
    fontSize: 14,
    fontWeight: "400",
    color: "#141414",
    letterSpacing: -0.308,
    textAlignVertical: "center",
  },
  sendButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
  },
  sendButtonDisabled: {
    opacity: 0.3,
  },
});
