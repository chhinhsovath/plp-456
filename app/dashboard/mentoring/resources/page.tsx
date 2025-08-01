'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Input, Button, Tag, Space, Pagination, Empty, Spin, Modal, Form, Upload, message } from 'antd';
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
  UploadOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Option } = Select;
const { Search } = Input;
const { TextArea } = Input;

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
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: null as string | null,
    type: null as string | null,
    language: null as string | null,
    search: '',
    favorites: false,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadForm] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  useEffect(() => {
    fetchResources();
  }, [filters, pagination.page]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.category) params.append('category', filters.category);
      if (filters.type) params.append('type', filters.type);
      if (filters.language) params.append('language', filters.language);
      if (filters.search) params.append('search', filters.search);
      if (filters.favorites) params.append('favorites', 'true');

      const response = await fetch(`/api/mentoring/resources?${params}`);
      const data = await response.json();

      if (response.ok) {
        setResources(data.resources);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      message.error('មានបញ្ហាក្នុងការទាញយកធនធាន');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (resourceId: string) => {
    try {
      const response = await fetch('/api/mentoring/resources/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId }),
      });

      if (response.ok) {
        const { favorited } = await response.json();
        setResources(prev => prev.map(r => 
          r.id === resourceId 
            ? { 
                ...r, 
                isFavorited: favorited,
                favoriteCount: favorited ? r.favoriteCount + 1 : r.favoriteCount - 1
              }
            : r
        ));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      message.error('មានបញ្ហាក្នុងការចូលចិត្ត');
    }
  };

  const trackAndDownload = async (resource: Resource) => {
    try {
      // Track download
      await fetch(`/api/mentoring/resources/${resource.id}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'download' }),
      });

      // Open file
      if (resource.fileUrl) {
        window.open(resource.fileUrl, '_blank');
      }
    } catch (error) {
      console.error('Error downloading resource:', error);
    }
  };

  const viewResource = async (resource: Resource) => {
    try {
      // Track view
      await fetch(`/api/mentoring/resources/${resource.id}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'view' }),
      });

      // Navigate to detail page
      router.push(`/dashboard/mentoring/resources/${resource.id}`);
    } catch (error) {
      console.error('Error viewing resource:', error);
    }
  };

  const handleUpload = async (values: any) => {
    try {
      setUploading(true);
      
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

      if (response.ok) {
        message.success('បានបង្ហោះធនធានដោយជោគជ័យ');
        setUploadModalVisible(false);
        uploadForm.resetFields();
        setFileList([]);
        fetchResources();
      } else {
        message.error('មានបញ្ហាក្នុងការបង្ហោះធនធាន');
      }
    } catch (error) {
      console.error('Error uploading resource:', error);
      message.error('មានបញ្ហាក្នុងការបង្ហោះធនធាន');
    } finally {
      setUploading(false);
    }
  };

  const getResourceIcon = (type: string) => {
    const typeOption = typeOptions.find(t => t.value === type);
    return typeOption?.icon || <FileTextOutlined />;
  };

  const ResourceCard = ({ resource }: { resource: Resource }) => (
    <Card
      hoverable
      cover={
        resource.thumbnailUrl ? (
          <img 
            alt={resource.title} 
            src={resource.thumbnailUrl} 
            style={{ height: 200, objectFit: 'cover' }}
          />
        ) : (
          <div className="h-[200px] bg-gray-100 flex items-center justify-center text-6xl text-gray-400">
            {getResourceIcon(resource.type)}
          </div>
        )
      }
      actions={[
        <Button 
          key="view"
          type="text" 
          icon={<EyeOutlined />}
          onClick={() => viewResource(resource)}
        >
          {resource.viewCount}
        </Button>,
        <Button 
          key="download"
          type="text" 
          icon={<DownloadOutlined />}
          onClick={() => trackAndDownload(resource)}
          disabled={!resource.fileUrl}
        >
          {resource.downloadCount}
        </Button>,
        <Button
          key="favorite"
          type="text"
          icon={resource.isFavorited ? <HeartFilled className="text-red-500" /> : <HeartOutlined />}
          onClick={() => toggleFavorite(resource.id)}
        >
          {resource.favoriteCount}
        </Button>,
      ]}
    >
      <Card.Meta
        title={
          <div className="line-clamp-1">
            {resource.language === 'km' || resource.language === 'both' 
              ? resource.titleKh 
              : resource.title}
          </div>
        }
        description={
          <div>
            <p className="line-clamp-2 text-gray-600 mb-2">
              {resource.language === 'km' || resource.language === 'both' 
                ? resource.descriptionKh 
                : resource.description}
            </p>
            <Space size="small" wrap>
              <Tag color="blue">
                {categoryOptions.find(c => c.value === resource.category)?.label}
              </Tag>
              <Tag>{typeOptions.find(t => t.value === resource.type)?.label}</Tag>
              {resource.language === 'both' && <Tag color="green">KH/EN</Tag>}
            </Space>
            <div className="mt-2 text-xs text-gray-500">
              បង្កើតដោយ {resource.uploader.name}
            </div>
          </div>
        }
      />
    </Card>
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">បណ្ណាល័យធនធានណែនាំ</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setUploadModalVisible(true)}
        >
          បង្ហោះធនធានថ្មី
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="ប្រភេទធនធាន"
              allowClear
              style={{ width: '100%' }}
              value={filters.type}
              onChange={(value) => setFilters({ ...filters, type: value })}
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
              onChange={(value) => setFilters({ ...filters, category: value })}
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
              onChange={(value) => setFilters({ ...filters, language: value })}
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
              onClick={() => setFilters({ ...filters, favorites: !filters.favorites })}
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
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onSearch={() => setPagination({ ...pagination, page: 1 })}
            />
          </Col>
        </Row>
      </Card>

      {/* Resources Grid */}
      {loading ? (
        <div className="text-center py-12">
          <Spin size="large" />
        </div>
      ) : resources.length === 0 ? (
        <Empty description="មិនមានធនធានទេ" />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {resources.map(resource => (
              <Col key={resource.id} xs={24} sm={12} md={8} lg={6}>
                <ResourceCard resource={resource} />
              </Col>
            ))}
          </Row>
          <div className="mt-6 text-center">
            <Pagination
              current={pagination.page}
              total={pagination.total}
              pageSize={pagination.limit}
              showSizeChanger={false}
              onChange={(page) => setPagination({ ...pagination, page })}
            />
          </div>
        </>
      )}

      {/* Upload Modal */}
      <Modal
        title="បង្ហោះធនធានថ្មី"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={uploadForm}
          layout="vertical"
          onFinish={handleUpload}
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
              <Button type="primary" htmlType="submit" loading={uploading}>
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
  );
}