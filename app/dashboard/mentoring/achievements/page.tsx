'use client';

import { useState, useEffect } from 'react';
import { Card, Tabs, Badge as AntBadge, Empty, Spin, Row, Col, Button, Modal, Typography, Tag, Progress, message } from 'antd';
import { TrophyOutlined, SafetyCertificateOutlined, CrownOutlined, StarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import Image from 'next/image';

const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;

interface Badge {
  id: string;
  code: string;
  name: string;
  nameKh: string;
  description?: string;
  descriptionKh?: string;
  category: string;
  level: number;
  iconUrl?: string;
  criteria: any;
}

interface UserBadge {
  id: string;
  badgeId: string;
  earnedDate: string;
  earnedFor?: string;
  badge: Badge;
}

interface Certificate {
  id: string;
  certificateNo: string;
  issuedDate: string;
  expiryDate?: string;
  achievementData: any;
  verificationCode: string;
  template: {
    name: string;
    nameKh: string;
    type: string;
  };
}

export default function AchievementsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('badges');
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      
      // Fetch user's badges
      const badgesRes = await fetch('/api/mentoring/badges?userId=currentUser');
      const badgesData = await badgesRes.json();
      setUserBadges(badgesData.userBadges || []);

      // Fetch all available badges
      const allBadgesRes = await fetch('/api/mentoring/badges');
      const allBadgesData = await allBadgesRes.json();
      setAllBadges(allBadgesData.badges || []);

      // Fetch certificates
      const certsRes = await fetch('/api/mentoring/certificates?userId=currentUser');
      const certsData = await certsRes.json();
      setCertificates(certsData.certificates || []);

      // Check for new badges
      await checkBadgeEligibility();
    } catch (error) {
      console.error('Error fetching achievements:', error);
      message.error('មានបញ្ហាក្នុងការទាញយកទិន្នន័យ');
    } finally {
      setLoading(false);
    }
  };

  const checkBadgeEligibility = async () => {
    try {
      const response = await fetch('/api/mentoring/badges', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'currentUser' }),
      });

      const data = await response.json();
      if (data.newBadges && data.newBadges.length > 0) {
        message.success(`អបអរសាទរ! អ្នកទទួលបានស្លាកសញ្ញាថ្មីចំនួន ${data.newBadges.length}`);
        fetchAchievements(); // Refresh the list
      }
    } catch (error) {
      console.error('Error checking badge eligibility:', error);
    }
  };

  const getBadgeIcon = (level: number) => {
    switch (level) {
      case 1:
        return <StarOutlined style={{ fontSize: 24, color: '#cd7f32' }} />; // Bronze
      case 2:
        return <StarOutlined style={{ fontSize: 24, color: '#c0c0c0' }} />; // Silver
      case 3:
        return <CrownOutlined style={{ fontSize: 24, color: '#ffd700' }} />; // Gold
      default:
        return <TrophyOutlined style={{ fontSize: 24 }} />;
    }
  };

  const getLevelName = (level: number) => {
    const levels = {
      1: { en: 'Bronze', kh: 'សំរិទ្ធ' },
      2: { en: 'Silver', kh: 'ប្រាក់' },
      3: { en: 'Gold', kh: 'មាស' },
    };
    return levels[level as keyof typeof levels] || { en: 'Basic', kh: 'មូលដ្ឋាន' };
  };

  const BadgeCard = ({ badge, earned }: { badge: Badge; earned?: UserBadge }) => {
    const isEarned = !!earned;
    const levelInfo = getLevelName(badge.level);

    return (
      <Card
        className={`cursor-pointer transition-all ${isEarned ? '' : 'opacity-60'}`}
        hoverable
        onClick={() => setSelectedBadge(badge)}
        style={{ height: '100%' }}
      >
        <div className="text-center">
          {badge.iconUrl ? (
            <Image 
              src={badge.iconUrl} 
              alt={badge.name} 
              width={64} 
              height={64} 
              className="mx-auto mb-2"
            />
          ) : (
            <div className="mb-2">{getBadgeIcon(badge.level)}</div>
          )}
          <Title level={5} className="mb-1">{badge.nameKh}</Title>
          <Text type="secondary" className="text-xs">{badge.name}</Text>
          <div className="mt-2">
            <Tag color={badge.level === 3 ? 'gold' : badge.level === 2 ? 'default' : 'orange'}>
              {levelInfo.kh}
            </Tag>
          </div>
          {isEarned && (
            <div className="mt-2">
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
              <Text type="secondary" className="block text-xs mt-1">
                {new Date(earned.earnedDate).toLocaleDateString('km-KH')}
              </Text>
            </div>
          )}
        </div>
      </Card>
    );
  };

  const CertificateCard = ({ certificate }: { certificate: Certificate }) => (
    <Card
      hoverable
      onClick={() => setSelectedCertificate(certificate)}
      style={{ height: '100%' }}
    >
      <div className="text-center">
        <SafetyCertificateOutlined style={{ fontSize: 48, color: '#1890ff' }} className="mb-4" />
        <Title level={5}>{certificate.template.nameKh}</Title>
        <Text type="secondary">{certificate.template.name}</Text>
        <div className="mt-4">
          <Text className="block">លេខ: {certificate.certificateNo}</Text>
          <Text type="secondary" className="block text-sm">
            ចេញថ្ងៃ: {new Date(certificate.issuedDate).toLocaleDateString('km-KH')}
          </Text>
        </div>
        <Button type="link" className="mt-2">
          មើលលម្អិត
        </Button>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Spin size="large" />
      </div>
    );
  }

  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge.id));
  const earnedCount = userBadges.length;
  const totalCount = allBadges.length;
  const progressPercent = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>សមិទ្ធផលនិងការទទួលស្គាល់</Title>
        <Paragraph>
          តាមដានស្លាកសញ្ញា និងវិញ្ញាបនបត្រដែលអ្នកទទួលបាន
        </Paragraph>
      </div>

      <Card className="mb-6">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12}>
            <Title level={4} className="mb-2">វឌ្ឍនភាពរបស់អ្នក</Title>
            <Progress 
              percent={Math.round(progressPercent)} 
              status="active"
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            <Text type="secondary">
              បានទទួល {earnedCount} ក្នុងចំណោម {totalCount} ស្លាកសញ្ញា
            </Text>
          </Col>
          <Col xs={24} sm={12} className="text-right">
            <Button 
              type="primary" 
              icon={<TrophyOutlined />}
              onClick={checkBadgeEligibility}
            >
              ពិនិត្យស្លាកសញ្ញាថ្មី
            </Button>
          </Col>
        </Row>
      </Card>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span>
              <TrophyOutlined /> ស្លាកសញ្ញា
              <AntBadge count={earnedCount} className="ml-2" />
            </span>
          } 
          key="badges"
        >
          <Row gutter={[16, 16]}>
            {allBadges.map(badge => {
              const earned = userBadges.find(ub => ub.badge.id === badge.id);
              return (
                <Col xs={12} sm={8} md={6} key={badge.id}>
                  <BadgeCard badge={badge} earned={earned} />
                </Col>
              );
            })}
          </Row>
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <SafetyCertificateOutlined /> វិញ្ញាបនបត្រ
              <AntBadge count={certificates.length} className="ml-2" />
            </span>
          } 
          key="certificates"
        >
          {certificates.length === 0 ? (
            <Empty description="មិនមានវិញ្ញាបនបត្រទេ" />
          ) : (
            <Row gutter={[16, 16]}>
              {certificates.map(cert => (
                <Col xs={24} sm={12} md={8} key={cert.id}>
                  <CertificateCard certificate={cert} />
                </Col>
              ))}
            </Row>
          )}
        </TabPane>
      </Tabs>

      {/* Badge Detail Modal */}
      <Modal
        open={!!selectedBadge}
        onCancel={() => setSelectedBadge(null)}
        footer={null}
        width={600}
      >
        {selectedBadge && (
          <div className="text-center">
            {selectedBadge.iconUrl ? (
              <Image 
                src={selectedBadge.iconUrl} 
                alt={selectedBadge.name} 
                width={120} 
                height={120} 
                className="mx-auto mb-4"
              />
            ) : (
              <div className="mb-4">{getBadgeIcon(selectedBadge.level)}</div>
            )}
            <Title level={3}>{selectedBadge.nameKh}</Title>
            <Text type="secondary">{selectedBadge.name}</Text>
            <Paragraph className="mt-4">
              {selectedBadge.descriptionKh || selectedBadge.description}
            </Paragraph>
            {earnedBadgeIds.has(selectedBadge.id) && (
              <Tag color="success" className="mt-2">
                <CheckCircleOutlined /> បានទទួល
              </Tag>
            )}
          </div>
        )}
      </Modal>

      {/* Certificate Detail Modal */}
      <Modal
        open={!!selectedCertificate}
        onCancel={() => setSelectedCertificate(null)}
        footer={[
          <Button key="verify" type="primary" onClick={() => {
            window.open(`/verify-certificate?code=${selectedCertificate?.verificationCode}`, '_blank');
          }}>
            ផ្ទៀងផ្ទាត់វិញ្ញាបនបត្រ
          </Button>,
          <Button key="download" onClick={() => {
            // TODO: Implement certificate download
            message.info('មុខងារទាញយកនឹងមានក្នុងពេលឆាប់ៗ');
          }}>
            ទាញយក PDF
          </Button>,
        ]}
        width={700}
      >
        {selectedCertificate && (
          <div>
            <div className="text-center mb-4">
              <SafetyCertificateOutlined style={{ fontSize: 64, color: '#1890ff' }} />
            </div>
            <Title level={3} className="text-center">
              {selectedCertificate.template.nameKh}
            </Title>
            <div className="mt-4">
              <p><strong>លេខវិញ្ញាបនបត្រ:</strong> {selectedCertificate.certificateNo}</p>
              <p><strong>កាលបរិច្ឆេទចេញ:</strong> {new Date(selectedCertificate.issuedDate).toLocaleDateString('km-KH')}</p>
              {selectedCertificate.expiryDate && (
                <p><strong>ផុតកំណត់:</strong> {new Date(selectedCertificate.expiryDate).toLocaleDateString('km-KH')}</p>
              )}
              <p><strong>លេខកូដផ្ទៀងផ្ទាត់:</strong> <code>{selectedCertificate.verificationCode}</code></p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}