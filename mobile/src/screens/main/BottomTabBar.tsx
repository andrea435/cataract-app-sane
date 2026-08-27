import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { colors } from '../../theme/colors';
import { TabClinicsIcon, TabHistoryIcon, TabProfileIcon, TabScanIcon } from '../../components/icons';
import { TabKey } from '../../state/ScreeningContext';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'scan', label: 'Scan' },
  { key: 'history', label: 'History' },
  { key: 'clinics', label: 'Clinics' },
  { key: 'profile', label: 'Profile' },
];

export default function BottomTabBar({ active, onSelect }: { active: TabKey; onSelect: (t: TabKey) => void }) {
  return (
    <View style={styles.bar}>
      {TABS.map(tab => {
        const color = active === tab.key ? colors.brand : colors.textFaint;
        return (
          <Pressable key={tab.key} style={styles.item} onPress={() => onSelect(tab.key)}>
            {tab.key === 'scan' && <TabScanIcon color={color} />}
            {tab.key === 'history' && <TabHistoryIcon color={color} />}
            {tab.key === 'clinics' && <TabClinicsIcon color={color} />}
            {tab.key === 'profile' && <TabProfileIcon color={color} />}
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: 10,
    paddingHorizontal: 8,
    paddingBottom: 10,
    backgroundColor: colors.cardBg,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '600',
  },
});
