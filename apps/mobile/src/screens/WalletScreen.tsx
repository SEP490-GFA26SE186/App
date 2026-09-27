// apps/mobile/src/screens/WalletScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { HeyButton } from '../components/ui/HeyButton';
import { HeyCard } from '../components/ui/HeyCard';
import { HeyInput } from '../components/ui/HeyInput';
import { UserAccount, WalletTransaction } from '../../../../packages/shared-types';
import { Colors } from '../theme/colors';

interface WalletScreenProps {
  currentUser: UserAccount;
  transactions: WalletTransaction[];
  onUserUpdate: (user: UserAccount) => void;
  onRefreshWallet: () => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({
  currentUser,
  transactions,
  onUserUpdate,
  onRefreshWallet,
}) => {
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedTopupGems, setSelectedTopupGems] = useState(50);
  const [withdrawAmount, setWithdrawAmount] = useState('200000');
  const [notice, setNotice] = useState<string | null>(null);

  const handleTopup = () => {
    const updated = {
      ...currentUser,
      creditBalance: (currentUser.creditBalance || 0) + selectedTopupGems,
    };
    onUserUpdate(updated);
    setShowTopupModal(false);
    setNotice(`Đã nạp thành công +${selectedTopupGems} 💎 Credits!`);
    setTimeout(() => setNotice(null), 2500);
  };

  const handleWithdraw = () => {
    const amt = parseInt(withdrawAmount, 10);
    if (!amt || amt > (currentUser.sellerAvailableBalance || 0)) {
      alert('Số dư khả dụng không đủ để rút!');
      return;
    }
    const updated = {
      ...currentUser,
      sellerAvailableBalance: (currentUser.sellerAvailableBalance || 0) - amt,
    };
    onUserUpdate(updated);
    setShowWithdrawModal(false);
    setNotice(`Đã gửi yêu cầu rút ${amt.toLocaleString('vi-VN')} đ về Vietcombank!`);
    setTimeout(() => setNotice(null), 2500);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Wallet Balance Card */}
      <View style={styles.walletCard}>
        <Text style={styles.walletTag}>💎 Ví Tài Khoản StoryWeaver</Text>

        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Số dư Credits sáng tác</Text>
            <Text style={styles.balanceValue}>
              💎 {currentUser?.creditBalance || 0}
            </Text>
          </View>
          <HeyButton
            title="➕ Nạp Credits"
            variant="yellow"
            size="sm"
            onPress={() => setShowTopupModal(true)}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.sellerBalanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Doanh thu khả dụng (Tác giả)</Text>
            <Text style={styles.sellerBalanceValue}>
              {currentUser?.sellerAvailableBalance?.toLocaleString('vi-VN') || 0} đ
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowWithdrawModal(true)}
            style={styles.withdrawPill}
          >
            <Text style={styles.withdrawPillText}>Rút tiền 💸</Text>
          </TouchableOpacity>
        </View>
      </View>

      {notice && (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>✨ {notice}</Text>
        </View>
      )}

      {/* Transaction History */}
      <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>

      {transactions.length === 0 ? (
        <HeyCard style={styles.emptyCard}>
          <Text style={styles.emptyText}>Chưa có giao dịch phát sinh</Text>
        </HeyCard>
      ) : (
        transactions.map((tx) => (
          <View key={tx.id} style={styles.txRow}>
            <View style={styles.txIconBox}>
              <Text style={styles.txIcon}>
                {tx.type === 'TOPUP' ? '💎' : tx.type === 'PURCHASE' ? '🛒' : '💸'}
              </Text>
            </View>
            <View style={styles.txInfo}>
              <Text style={styles.txDesc}>{tx.description}</Text>
              <Text style={styles.txTime}>
                {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
              </Text>
            </View>
            <Text
              style={[
                styles.txAmount,
                tx.type === 'TOPUP' ? styles.txPositive : styles.txNegative,
              ]}
            >
              {tx.type === 'TOPUP' ? '+' : '-'}
              {tx.amountCredits ? `${tx.amountCredits} 💎` : `${tx.amountVnd?.toLocaleString('vi-VN')} đ`}
            </Text>
          </View>
        ))
      )}

      {/* Topup Modal */}
      <Modal visible={showTopupModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nạp Credits Sáng Tác</Text>
            <Text style={styles.modalSubtitle}>
              Mỗi câu chuyện AI tiêu hao 3 💎 Credits
            </Text>

            <View style={styles.packageGrid}>
              {[
                { gems: 30, price: '30.000 đ' },
                { gems: 50, price: '50.000 đ', popular: true },
                { gems: 100, price: '90.000 đ' },
              ].map((pkg) => (
                <TouchableOpacity
                  key={pkg.gems}
                  onPress={() => setSelectedTopupGems(pkg.gems)}
                  style={[
                    styles.pkgCard,
                    selectedTopupGems === pkg.gems && styles.pkgCardActive,
                  ]}
                >
                  <Text style={styles.pkgGems}>💎 {pkg.gems}</Text>
                  <Text style={styles.pkgPrice}>{pkg.price}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtnRow}>
              <HeyButton
                title="Hủy"
                variant="outline"
                onPress={() => setShowTopupModal(false)}
                style={styles.modalCancelBtn}
              />
              <HeyButton
                title="⚡ Thanh toán PayOS"
                onPress={handleTopup}
                style={styles.modalActionBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Withdraw Modal */}
      <Modal visible={showWithdrawModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rút Doanh Thu Tác Giả</Text>
            <Text style={styles.modalSubtitle}>
              Chuyển về tài khoản ngân hàng liên kết trong 24h
            </Text>

            <HeyInput
              label="Số tiền rút (VND)"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              keyboardType="numeric"
            />

            <View style={styles.modalBtnRow}>
              <HeyButton
                title="Hủy"
                variant="outline"
                onPress={() => setShowWithdrawModal(false)}
                style={styles.modalCancelBtn}
              />
              <HeyButton
                title="Xác nhận rút"
                variant="teal"
                onPress={handleWithdraw}
                style={styles.modalActionBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  walletCard: {
    backgroundColor: '#2B6CB0',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  walletTag: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    opacity: 0.9,
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.9,
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 14,
  },
  sellerBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sellerBalanceValue: {
    color: '#90CDF4',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  withdrawPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  withdrawPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  noticeBox: {
    backgroundColor: Colors.greenLight,
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  noticeText: {
    color: Colors.green,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textDark,
    marginBottom: 10,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  txIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  txIcon: {
    fontSize: 18,
  },
  txInfo: {
    flex: 1,
  },
  txDesc: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textDark,
  },
  txTime: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '900',
  },
  txPositive: {
    color: Colors.green,
  },
  txNegative: {
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textDark,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 16,
  },
  packageGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pkgCard: {
    width: '31%',
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  pkgCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  pkgGems: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textDark,
    marginBottom: 4,
  },
  pkgPrice: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  modalBtnRow: {
    flexDirection: 'row',
  },
  modalCancelBtn: {
    flex: 1,
    marginRight: 8,
  },
  modalActionBtn: {
    flex: 2,
  },
});
