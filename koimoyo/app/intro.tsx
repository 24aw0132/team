import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INTRO_SEEN_KEY = 'INTRO_SEEN';

const TERMS_TEXT = `
最終更新日：2025年7月8日

この利用規約（以下「本規約」といいます）は、こいもよう（以下「本アプリ」といいます）の利用に関する条件を定めるものです。本アプリを利用される方（以下「ユーザー」といいます）は、本規約に同意のうえご利用ください。

第1条（本アプリの目的）
本アプリは、カップルが日々の出来事や気持ちを記録・共有し、2人の思い出を振り返ることができる日記アプリです。

第2条（利用登録）
本アプリの一部機能の利用には、アカウントの登録が必要です。登録の際は、正確な情報を提供してください。虚偽の情報に基づく登録は禁止します。

第3条（アカウントとペア機能）
本アプリでは、1対1のペア機能が提供され、特定の相手と日記やデータを共有することができます。ペアの相手とは相互同意に基づいて接続され、いつでもペア解除が可能です。

第4条（禁止事項）
・他者になりすまして登録または利用する行為
・公序良俗または法令に反する内容の投稿
・本アプリの運営を妨害する行為
・他人のプライバシーを侵害する行為
・無断で広告・営業を行う行為

第5条（投稿内容の管理）
投稿された日記、写真、絵文字などのコンテンツ（以下「ユーザーコンテンツ」）は、ペア間でのみ閲覧できる非公開コンテンツとして扱われます。

第6条（個人情報の取り扱い）
ユーザーの個人情報は、当社の「プライバシーポリシー」に基づき適切に管理します。

第7条（サービスの停止・変更）
当社は、やむを得ない事情により、本アプリの提供を一時的に停止することがあります。また、予告なくサービス内容の全部または一部を変更・終了することがあります。

第8条（免責事項）
・本アプリの利用によりユーザーに生じた損害について、当社は一切の責任を負いません。
・ペア間のトラブルについても、当社は関与せず、責任を負いません。

第9条（利用規約の変更）
本規約の内容は、ユーザーへの通知なく変更されることがあります。

第10条（準拠法・管轄裁判所）
本規約の解釈には日本法を適用し、本アプリに関する紛争については、[運営会社の所在地]を管轄する裁判所を専属的合意管轄とします。
`;

const GUIDE_TEXT = `
このアプリでは、カップルが日々の出来事や気持ちを記録・共有し、2人の思い出を振り返ることができます。

1. 日記の投稿
日々の出来事や感情を自由に書き込むことができます。写真や絵文字も添えて、より豊かな表現が可能です。

2. ペア機能
特定の相手とペアを組むことで、2人だけの日記を共有できます。ペアはいつでも解除可能です。

3. 思い出の振り返り
過去の日記を振り返ることで、2人の関係の変化や成長を感じることができます。

4. プライバシー保護
投稿された日記や写真は、ペア間でのみ閲覧可能な非公開コンテンツとして扱われます。

5. 簡単な操作
直感的なインターフェースで、誰でも簡単に使い始めることができます。

6. カスタマイズ可能
日記のテーマを変更することで、あなたの個性を表現できます。

7. 安全なデータ管理
ユーザーの個人情報は適切に管理され、プライバシーを保護します。
`;

export default function IntroScreen() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [tab, setTab] = useState<'terms' | 'guide'>('terms');

  const handleStartApp = async () => {
    try {
      // 记录用户已经看过引导页
      await AsyncStorage.setItem(INTRO_SEEN_KEY, 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving intro status:', error);
      // 即使保存失败，也允许用户继续
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'terms' && styles.tabActive]}
          onPress={() => setTab('terms')}
        >
          <Text style={[styles.tabText, tab === 'terms' && styles.tabTextActive]}>利用規約</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'guide' && styles.tabActive]}
          onPress={() => setTab('guide')}
        >
          <Text style={[styles.tabText, tab === 'guide' && styles.tabTextActive]}>初心者ガイド</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <ScrollView>
          <Text style={styles.title}>{tab === 'terms' ? '利用規約' : '初心者ガイド'}</Text>
          <Text style={styles.text}>{tab === 'terms' ? TERMS_TEXT : GUIDE_TEXT}</Text>
        </ScrollView>
      </View>

      <View style={styles.agreeContainer}>
        <Checkbox
          value={agreed}
          onValueChange={setAgreed}
          color={agreed ? '#FF84A7' : undefined}
        />
        <Text style={styles.agreeText}>利用規約に同意する</Text>
      </View>

      <Button
        title="はじめる！"
        onPress={handleStartApp}
        color="#FF84A7"
        disabled={!agreed}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF9FB',
    alignItems: 'center',
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 32,
    marginBottom: 8,
    backgroundColor: '#F3E6EC',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  tabActive: {
    backgroundColor: '#FF84A7',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
  },
  tabTextActive: {
    color: '#fff',
  },
  card: {
    width: '90%',
    maxHeight: '55%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF84A7',
    marginBottom: 12,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  agreeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  agreeText: {
    marginLeft: 8,
    fontSize: 16,
  },
});
