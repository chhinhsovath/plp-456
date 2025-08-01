'use client';

import { Card, Tag, Space, Typography, Button, Dropdown, Menu } from 'antd';
import { 
  CalendarOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { SwipeableHandlers, useSwipeable } from 'react-swipeable';
import { useState } from 'react';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface MobileSessionCardProps {
  session: {
    id: string;
    scheduledDate: string;
    sessionType: string;
    status: string;
    location: string;
    duration?: number;
    relationship: {
      mentor: { name: string };
      mentee: { name: string };
    };
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onComplete?: (id: string) => void;
}

export function MobileSessionCard({ 
  session, 
  onEdit, 
  onDelete, 
  onComplete 
}: MobileSessionCardProps) {
  const [showActions, setShowActions] = useState(false);

  const handlers = useSwipeable({
    onSwipedLeft: () => setShowActions(true),
    onSwipedRight: () => setShowActions(false),
    trackMouse: true,
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: 'blue',
      IN_PROGRESS: 'processing',
      COMPLETED: 'success',
      CANCELLED: 'error',
    };
    return colors[status] || 'default';
  };

  const getSessionTypeKhmer = (type: string) => {
    const types: Record<string, string> = {
      CLASSROOM_OBSERVATION: 'សង្កេតថ្នាក់រៀន',
      LESSON_PLANNING: 'ផែនការបង្រៀន',
      REFLECTIVE_PRACTICE: 'ការឆ្លុះបញ្ចាំង',
      PEER_LEARNING: 'រៀនពីមិត្តភក្តិ',
    };
    return types[type] || type;
  };

  const moreMenu = (
    <Menu>
      {onComplete && session.status === 'SCHEDULED' && (
        <Menu.Item key="complete" icon={<CheckCircleOutlined />} onClick={() => onComplete(session.id)}>
          បញ្ចប់វគ្គ
        </Menu.Item>
      )}
      {onEdit && (
        <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => onEdit(session.id)}>
          កែសម្រួល
        </Menu.Item>
      )}
      {onDelete && (
        <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => onDelete(session.id)}>
          លុប
        </Menu.Item>
      )}
    </Menu>
  );

  return (
    <div {...handlers} className="relative mb-4">
      <Card
        className={`mentoring-session-card transition-transform ${showActions ? '-translate-x-20' : ''}`}
        bodyStyle={{ padding: 16 }}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <Title level={5} className="mb-1">
              {getSessionTypeKhmer(session.sessionType)}
            </Title>
            <Text type="secondary" className="text-sm">
              {session.relationship.mentor.name} → {session.relationship.mentee.name}
            </Text>
          </div>
          <Tag color={getStatusColor(session.status)}>
            {session.status}
          </Tag>
        </div>

        <Space direction="vertical" size={4} className="w-full">
          <div className="flex items-center gap-2 text-sm">
            <CalendarOutlined className="text-gray-500" />
            <Text>{dayjs(session.scheduledDate).format('DD MMM YYYY')}</Text>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ClockCircleOutlined className="text-gray-500" />
            <Text>{dayjs(session.scheduledDate).format('HH:mm')}</Text>
            {session.duration && (
              <Text type="secondary">({session.duration} នាទី)</Text>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <EnvironmentOutlined className="text-gray-500" />
            <Text>{session.location}</Text>
          </div>
        </Space>

        <div className="absolute right-2 top-2">
          <Dropdown overlay={moreMenu} trigger={['click']} placement="bottomRight">
            <Button
              type="text"
              icon={<MoreOutlined />}
              className="px-2"
            />
          </Dropdown>
        </div>
      </Card>

      {/* Swipe actions */}
      {showActions && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center">
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete?.(session.id)}
            className="h-full rounded-l-none"
          >
            លុប
          </Button>
        </div>
      )}
    </div>
  );
}