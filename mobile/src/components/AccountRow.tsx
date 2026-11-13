import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors } from '../theme/colors';
import { ProfileRow, initialsOf } from '../data/types';

/** One person's login in a list, with an optional Remove action. */
export function AccountRow({ account, isYou, onRemove }: { account: ProfileRow; isYou?: boolean; onRemove?: () => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initialsOf(account.full_name)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {account.full_name}
          </Text>
          {isYou && <Text style={styles.tag}>You</Text>}
          {account.is_admin && <Text style={styles.tag}>Admin</Text>}
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {[account.email, account.region].filter(Boolean).join(' · ')}
        </Text>
      </View>
      {onRemove && !isYou && (
        <Pressable onPress={onRemove} hitSlop={8}>
          <Text style={styles.remove}>Remove</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, backgroundColor: colors.surfaceMuted },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brandTint, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12.5, fontWeight: '700', color: colors.brandDark },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 13.5, fontWeight: '600', color: colors.ink, flexShrink: 1 },
  tag: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.brandDark,
    backgroundColor: colors.brandTint,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  meta: { fontSize: 12, color: colors.textSubtle, marginTop: 2 },
  remove: { fontSize: 12.5, fontWeight: '600', color: colors.danger },
});
