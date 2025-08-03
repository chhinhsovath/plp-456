'use client';

import { useState, useCallback, useMemo } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Select, 
  Input, 
  Button, 
  Tag, 
  Space, 
  Pagination, 
  Empty, 
  Spin, 
  Modal, 
  Form, 
  Upload, 
  Typography, 
  Skeleton,
  Badge,
  Divider,
  Tooltip
} from 'antd';
import { 
  SearchOutlined, 
  FileTextOutlined, 
  VideoCameraOutlined, 
  FileImageOutlined,
  FilePdfOutlined,
  CheckSquareOutlined,
  BookOutlined,
  HeartOutlined,
  HeartFilled,
  DownloadOutlined,
  EyeOutlined,
  PlusOutlined,
  UploadOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/km';
import { useMessage } from '@/hooks/useAntdApp';

dayjs.extend(relativeTime);
dayjs.locale('km');

const { Option } = Select;
const { Search } = Input;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

interface Resource {
  id: string;
  title: string;
  titleKh: string;
  description?: string;
  descriptionKh?: string;
  type: string;
  category: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  tags: string[];
  language: string;
  viewCount: number;
  downloadCount: number;
  isFavorited: boolean;
  favoriteCount: number;
  uploader: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface ResourcesResponse {
  resources: Resource[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const categoryOptions = [
  { value: 'TEACHING_METHODS', label: 'វិធីសាស្ត្របង្រៀន' },
  { value: 'CLASSROOM_MANAGEMENT', label: 'ការគ្រប់គ្រងថ្នាក់រៀន' },
  { value: 'STUDENT_ENGAGEMENT', label: 'ការចូលរួមរបស់សិស្ស' },
  { value: 'ASSESSMENT', label: 'ការវាយតម្លៃ' },
  { value: 'TECHNOLOGY', label: 'បច្ចេកវិទ្យា' },
  { value: 'LESSON_PLANNING', label: 'ការរៀបចំផែនការបង្រៀន' },
  { value: 'PROFESSIONAL_DEVELOPMENT', label: 'ការអភិវឌ្ឍវិជ្ជាជីវៈ' },
];

const typeOptions = [
  { value: 'DOCUMENT', label: 'ឯកសារ', icon: <FileTextOutlined /> },
  { value: 'VIDEO', label: 'វីដេអូ', icon: <VideoCameraOutlined /> },
  { value: 'PRESENTATION', label: 'បទបង្ហាញ', icon: <FileImageOutlined /> },
  { value: 'TEMPLATE', label: 'គំរូ', icon: <FilePdfOutlined /> },
  { value: 'GUIDE', label: 'មគ្គុទ្ទេសក៍', icon: <BookOutlined /> },
  { value: 'CHECKLIST', label: 'បញ្ជីត្រួតពិនិត្យ', icon: <CheckSquareOutlined /> },
];

export default function MentoringResourcesLibrary() {
  const message = useMessage();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    category: null as string | null,
    type: null as string | null,
    language: null as string | null,
    search: '',
    favorites: false,
  });
  const [page, setPage] = useState(1);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadForm] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);

  // Build query key with filters
  const queryKey = useMemo(() => [
    'resources',
    { ...filters, page }
  ], [filters, page]);

  // Fetch resources using React Query
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      });

      if (filters.category) params.append('category', filters.category);
      if (filters.type) params.append('type', filters.type);
      if (filters.language) params.append('language', filters.language);
      if (filters.search) params.append('search', filters.search);
      if (filters.favorites) params.append('favorites', 'true');

      const response = await fetch(`/api/mentoring/resources?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }
      return response.json() as Promise<ResourcesResponse>;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Toggle favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      const response = await fetch('/api/mentoring/resources/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId }),
      });
      if (!response.ok) throw new Error('Failed to toggle favorite');
      return response.json();
    },
    onMutate: async (resourceId) => {
      await queryClient.cancelQueries({ queryKey });
      
      const previousData = queryClient.getQueryData<ResourcesResponse>(queryKey);
      
      queryClient.setQueryData<ResourcesResponse>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          resources: old.resources.map(r => 
            r.id === resourceId 
              ? { 
                  ...r, 
                  isFavorited: !r.isFavorited,
                  favoriteCount: r.isFavorited ? r.favoriteCount - 1 : r.favoriteCount + 1
                }
              : r
          )
        };
      });
      
      return { previousData };
    },
    onError: (err, resourceId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      message.error('មានបញ្ហាក្នុងការចូលចិត្ត');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });

  // Track resource action mutation
  const trackMutation = useMutation({
    mutationFn: async ({ resourceId, type }: { resourceId: string; type: 'view' | 'download' }) => {
      const response = await fetch(`/api/mentoring/resources/${resourceId}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (!response.ok) throw new Error('Failed to track action');
      return response.json();
    },
  });

  // Upload resource mutation
  const uploadMutation = useMutation({
    mutationFn: async (values: any) => {
      const formData = new FormData();
      if (fileList[0]) {
        formData.append('file', fileList[0].originFileObj);
      }
      formData.append('data', JSON.stringify({
        ...values,
        tags: values.tags?.split(',').map((t: string) => t.trim()).filter(Boolean) || [],
      }));

      const response = await fetch('/api/mentoring/resources', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload resource');
      return response.json();
    },
    onSuccess: () => {
      message.success('បានបង្ហោះធនធានដោយជោគជ័យ');
      setUploadModalVisible(false);
      uploadForm.resetFields();
      setFileList([]);
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
    onError: () => {
      message.error('មានបញ្ហាក្នុងការបង្ហោះធនធាន');
    },
  });

  const handleFilterChange = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const handleSearch = useCallback((value: string) => {
    handleFilterChange({ search: value });
  }, [handleFilterChange]);

  const toggleFavorite = useCallback((resourceId: string) => {
    favoriteMutation.mutate(resourceId);
  }, [favoriteMutation]);

  const trackAndDownload = useCallback(async (resource: Resource) => {
    trackMutation.mutate({ resourceId: resource.id, type: 'download' });
    if (resource.fileUrl) {
      window.open(resource.fileUrl, '_blank');
    }
  }, [trackMutation]);

  const viewResource = useCallback(async (resource: Resource) => {
    trackMutation.mutate({ resourceId: resource.id, type: 'view' });
    router.push(`/dashboard/mentoring/resources/${resource.id}`);
  }, [router, trackMutation]);

  const getResourceIcon = (type: string) => {
    const typeOption = typeOptions.find(t => t.value === type);
    return typeOption?.icon || <FileTextOutlined />;
  };

  const ResourceCard = ({ resource }: { resource: Resource }) => (
    <Card
      hoverable
      cover={
        resource.thumbnailUrl ? (
          <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
            <img 
              alt={resource.title} 
              src={resource.thumbnailUrl} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ) : (
          <div style={{ 
            height: 200, 
            backgroundColor: '#f0f0f0', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <span style={{ fontSize: 64, color: '#d9d9d9' }}>
              {getResourceIcon(resource.type)}
            </span>
          </div>
        )
      }
      actions={[
        <Tooltip key="view" title="មើល">
          <Button 
            type="text" 
            icon={<EyeOutlined />}
            onClick={() => viewResource(resource)}
          >
            {resource.viewCount}
          </Button>
        </Tooltip>,
        <Tooltip key="download" title="ទាញយក">
          <Button 
            type="text" 
            icon={<DownloadOutlined />}
            onClick={() => trackAndDownload(resource)}
            disabled={!resource.fileUrl}
          >
            {resource.downloadCount}
          </Button>
        </Tooltip>,
        <Tooltip key="favorite" title={resource.isFavorited ? 'លុបចេញពីចូលចិត្ត' : 'ចូលចិត្ត'}>
          <Button
            type="text"
            icon={resource.isFavorited ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
            onClick={() => toggleFavorite(resource.id)}
            loading={favoriteMutation.isPending && favoriteMutation.variables === resource.id}
          >
            {resource.favoriteCount}
          </Button>
        </Tooltip>,
      ]}
    >
      <Card.Meta
        title={
          <Tooltip title={resource.titleKh || resource.title}>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {resource.language === 'km' || resource.language === 'both' 
                ? resource.titleKh 
                : resource.title}
            </div>
          </Tooltip>
        }
        description={
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Paragraph 
              ellipsis={{ rows: 2 }} 
              style={{ marginBottom: 8, color: 'rgba(0, 0, 0, 0.65)' }}
            >
              {resource.language === 'km' || resource.language === 'both' 
                ? resource.descriptionKh 
                : resource.description}
            </Paragraph>
            <Space size="small" wrap>
              <Tag color="blue">
                {categoryOptions.find(c => c.value === resource.category)?.label}
              </Tag>
              <Tag>{typeOptions.find(t => t.value === resource.type)?.label}</Tag>
              {resource.language === 'both' && <Tag color="green">KH/EN</Tag>}
            </Space>
            <Space size="small" style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>
              <Text type="secondary">បង្កើតដោយ {resource.uploader.name}</Text>
              <Divider type="vertical" />
              <Space size={4}>
                <ClockCircleOutlined />
                <Text type="secondary">{dayjs(resource.createdAt).fromNow()}</Text>
              </Space>
            </Space>
          </Space>
        }
      />
    </Card>
  );

  const resources = data?.resources || [];
  const pagination = data?.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', padding: 0 }}>
      <div style={{ padding: '24px 32px' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>បណ្ណាល័យធនធានណែនាំ</Title>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setUploadModalVisible(true)}
              size="large"
            >
              បង្ហោះធនធានថ្មី
            </Button>
          </Col>
        </Row>

        {/* Filters */}
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="ប្រភេទធនធាន"
                allowClear
                style={{ width: '100%' }}
                value={filters.type}
                onChange={(value) => handleFilterChange({ type: value })}
              >
                {typeOptions.map(type => (
                  <Option key={type.value} value={type.value}>
                    <Space>
                      {type.icon}
                      {type.label}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="ប្រភេទ"
                allowClear
                style={{ width: '100%' }}
                value={filters.category}
                onChange={(value) => handleFilterChange({ category: value })}
              >
                {categoryOptions.map(cat => (
                  <Option key={cat.value} value={cat.value}>
                    {cat.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="ភាសា"
                allowClear
                style={{ width: '100%' }}
                value={filters.language}
                onChange={(value) => handleFilterChange({ language: value })}
              >
                <Option value="km">ខ្មែរ</Option>
                <Option value="en">English</Option>
                <Option value="both">ទាំងពីរ</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button
                type={filters.favorites ? 'primary' : 'default'}
                icon={filters.favorites ? <HeartFilled /> : <HeartOutlined />}
                onClick={() => handleFilterChange({ favorites: !filters.favorites })}
                block
              >
                ធនធានដែលចូលចិត្ត
              </Button>
            </Col>
            <Col span={24}>
              <Search
                placeholder="ស្វែងរកធនធាន..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                onSearch={handleSearch}
                loading={isFetching}
              />
            </Col>
          </Row>
        </Card>

        {/* Resources Grid */}
        {error ? (
          <Card>
            <Empty 
              description="មានបញ្ហាក្នុងការទាញយកធនធាន" 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" onClick={() => queryClient.invalidateQueries({ queryKey })}>
                ព្យាយាមម្តងទៀត
              </Button>
            </Empty>
          </Card>
        ) : isLoading ? (
          <Row gutter={[16, 16]}>
            {[...Array(8)].map((_, index) => (
              <Col key={index} xs={24} sm={12} md={8} lg={6}>
                <Card
                  cover={<Skeleton.Image active style={{ width: '100%', height: 200 }} />}
                  actions={[
                    <Skeleton.Button key="1" active size="small" />,
                    <Skeleton.Button key="2" active size="small" />,
                    <Skeleton.Button key="3" active size="small" />,
                  ]}
                >
                  <Skeleton active paragraph={{ rows: 3 }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : resources.length === 0 ? (
          <Card>
            <Empty 
              description="មិនមានធនធានទេ"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {resources.map(resource => (
                <Col key={resource.id} xs={24} sm={12} md={8} lg={6}>
                  <ResourceCard resource={resource} />
                </Col>
              ))}
            </Row>
            <Row justify="center" style={{ marginTop: 24 }}>
              <Col>
                <Pagination
                  current={page}
                  total={pagination.total}
                  pageSize={pagination.limit}
                  showSizeChanger={false}
                  onChange={setPage}
                  showTotal={(total, range) => `${range[0]}-${range[1]} នៃ ${total} ធនធាន`}
                />
              </Col>
            </Row>
          </>
        )}

        {/* Upload Modal */}
        <Modal
          title="បង្ហោះធនធានថ្មី"
          open={uploadModalVisible}
          onCancel={() => setUploadModalVisible(false)}
          footer={null}
          width={600}
          destroyOnClose
        >
          <Form
            form={uploadForm}
            layout="vertical"
            onFinish={(values) => uploadMutation.mutate(values)}
          >
            <Form.Item
              name="title"
              label="ចំណងជើង (English)"
              rules={[{ required: true, message: 'សូមបញ្ចូលចំណងជើង' }]}
            >
              <Input placeholder="Resource title in English" />
            </Form.Item>

            <Form.Item
              name="titleKh"
              label="ចំណងជើង (ខ្មែរ)"
              rules={[{ required: true, message: 'សូមបញ្ចូលចំណងជើងជាភាសាខ្មែរ' }]}
            >
              <Input placeholder="ចំណងជើងធនធានជាភាសាខ្មែរ" />
            </Form.Item>

            <Form.Item
              name="type"
              label="ប្រភេទធនធាន"
              rules={[{ required: true, message: 'សូមជ្រើសរើសប្រភេទ' }]}
            >
              <Select placeholder="ជ្រើសរើសប្រភេទធនធាន">
                {typeOptions.map(type => (
                  <Option key={type.value} value={type.value}>
                    <Space>
                      {type.icon}
                      {type.label}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="category"
              label="ប្រភេទ"
              rules={[{ required: true, message: 'សូមជ្រើសរើសប្រភេទ' }]}
            >
              <Select placeholder="ជ្រើសរើសប្រភេទ">
                {categoryOptions.map(cat => (
                  <Option key={cat.value} value={cat.value}>
                    {cat.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="language"
              label="ភាសា"
              rules={[{ required: true, message: 'សូមជ្រើសរើសភាសា' }]}
            >
              <Select placeholder="ជ្រើសរើសភាសា">
                <Option value="km">ខ្មែរ</Option>
                <Option value="en">English</Option>
                <Option value="both">ទាំងពីរ</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="description"
              label="ការពិពណ៌នា (English)"
            >
              <TextArea rows={3} placeholder="Description in English" />
            </Form.Item>

            <Form.Item
              name="descriptionKh"
              label="ការពិពណ៌នា (ខ្មែរ)"
            >
              <TextArea rows={3} placeholder="ការពិពណ៌នាជាភាសាខ្មែរ" />
            </Form.Item>

            <Form.Item
              name="tags"
              label="ស្លាក (Tags)"
              tooltip="បំបែកដោយសញ្ញាក្បៀស"
            >
              <Input placeholder="ឧទាហរណ៍: គំរូផែនការ, ថ្នាក់ទី៤, គណិតវិទ្យា" />
            </Form.Item>

            <Form.Item
              label="ឯកសារ"
            >
              <Upload
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                beforeUpload={() => false}
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>ជ្រើសរើសឯកសារ</Button>
              </Upload>
            </Form.Item>

            <Form.Item
              name="isPublic"
              valuePropName="checked"
              initialValue={true}
            >
              <Select defaultValue={true}>
                <Option value={true}>សាធារណៈ - គ្រប់គ្នាអាចមើលបាន</Option>
                <Option value={false}>ឯកជន - តែខ្ញុំប៉ុណ្ណោះ</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={uploadMutation.isPending}
                >
                  បង្ហោះ
                </Button>
                <Button onClick={() => setUploadModalVisible(false)}>
                  បោះបង់
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}