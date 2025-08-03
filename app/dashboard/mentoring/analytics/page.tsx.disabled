'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Select, DatePicker, Statistic, Progress, Table, Tag, Spin, Empty, Space } from 'antd';
import { UserOutlined, TeamOutlined, CalendarOutlined, RiseOutlined, TrophyOutlined, WarningOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from '@/lib/dayjs-config';
import { formatDateForDisplay, formatDateTimeForDisplay, DATE_FORMATS, formatDateForAPI } from '@/lib/date-utils';
import { ExportButton } from '@/components/ExportButton';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface AnalyticsData {
  overview: {
    totalRelationships: number;
    activeRelationships: number;
    totalSessions: number;
    completedSessions: number;
    averageSessionsPerMonth: number;
    averageRating: number;
  };
  sessionsByType: Array<{ type: string; count: number }>;
  sessionsByMonth: Array<{ month: string; count: number }>;
  topMentors: Array<{ 
    id: string; 
    name: string; 
    sessionsCount: number; 
    averageRating: number;
    menteeCount: number;
  }>;
  feedbackDistribution: {
    strengths: number;
    improvements: number;
    suggestions: number;
  };
  progressByFocusArea: Array<{
    area: string;
    relationships: number;
    completionRate: number;
  }>;
}

export default function MentoringAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(3, 'month'),
    dayjs(),
  ]);
  const [filterType, setFilterType] = useState<'all' | 'province' | 'district'>('all');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, filterType]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // This would call an analytics API endpoint
      // For now, we'll use mock data
      const mockData: AnalyticsData = {
        overview: {
          totalRelationships: 45,
          activeRelationships: 38,
          totalSessions: 256,
          completedSessions: 198,
          averageSessionsPerMonth: 21.3,
          averageRating: 4.2,
        },
        sessionsByType: [
          { type: 'ការសង្កេតក្នុងថ្នាក់រៀន', count: 120 },
          { type: 'ការគាំទ្រផែនការបង្រៀន', count: 65 },
          { type: 'ការអនុវត្តឆ្លុះបញ្ចាំង', count: 45 },
          { type: 'វង់សិក្សាមិត្តភក្តិ', count: 20 },
          { type: 'ការតាមដានបន្ត', count: 6 },
        ],
        sessionsByMonth: [
          { month: 'ខែ១', count: 15 },
          { month: 'ខែ២', count: 22 },
          { month: 'ខែ៣', count: 28 },
          { month: 'ខែ៤', count: 25 },
          { month: 'ខែ៥', count: 30 },
          { month: 'ខែ៦', count: 35 },
        ],
        topMentors: [
          { id: '1', name: 'លោក សុខ សំបូរ', sessionsCount: 32, averageRating: 4.8, menteeCount: 3 },
          { id: '2', name: 'លោកស្រី ចាន់ សុភា', sessionsCount: 28, averageRating: 4.6, menteeCount: 2 },
          { id: '3', name: 'លោក ហេង វុទ្ធី', sessionsCount: 25, averageRating: 4.5, menteeCount: 2 },
          { id: '4', name: 'លោកស្រី លី សុខលីម', sessionsCount: 22, averageRating: 4.7, menteeCount: 2 },
          { id: '5', name: 'លោក ពៅ សារ៉ាត់', sessionsCount: 20, averageRating: 4.4, menteeCount: 1 },
        ],
        feedbackDistribution: {
          strengths: 145,
          improvements: 89,
          suggestions: 62,
        },
        progressByFocusArea: [
          { area: 'ការគ្រប់គ្រងថ្នាក់រៀន', relationships: 25, completionRate: 78 },
          { area: 'វិធីសាស្ត្របង្រៀន', relationships: 20, completionRate: 85 },
          { area: 'ការប្រើប្រាស់បច្ចេកវិទ្យា', relationships: 15, completionRate: 65 },
          { area: 'ការវាយតម្លៃសិស្ស', relationships: 12, completionRate: 72 },
          { area: 'ការរៀបចំផែនការបង្រៀន', relationships: 10, completionRate: 90 },
        ],
      };
      
      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
  );
}

  if (!analyticsData) {
    return (
      <div className="p-6">
        <Empty description="មិនមានទិន្នន័យ" />
      </div>
    );
  }

  // Chart configurations
  const sessionTypeChartOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      name: 'ប្រភេទវគ្គ',
      type: 'pie',
      radius: '50%',
      data: analyticsData.sessionsByType.map(item => ({
        value: item.count,
        name: item.type,
      })),
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    }],
  };

  const sessionTrendChartOption = {
    xAxis: {
      type: 'category',
      data: analyticsData.sessionsByMonth.map(item => item.month),
    },
    yAxis: { type: 'value' },
    series: [{
      data: analyticsData.sessionsByMonth.map(item => item.count),
      type: 'line',
      smooth: true,
      areaStyle: {},
    }],
    tooltip: { trigger: 'axis' },
  };

  const feedbackChartOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'category',
      data: ['ចំណុចខ្លាំង', 'ត្រូវកែលម្អ', 'សំណូមពរ'],
    },
    yAxis: { type: 'value' },
    series: [{
      data: [
        analyticsData.feedbackDistribution.strengths,
        analyticsData.feedbackDistribution.improvements,
        analyticsData.feedbackDistribution.suggestions,
      ],
      type: 'bar',
      itemStyle: {
        color: (params: any) => {
          const colors = ['#52c41a', '#faad14', '#1890ff'];
          return colors[params.dataIndex];
        },
      },
    }],
  };

  const mentorColumns = [
    {
      title: 'គ្រូណែនាំ',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'វគ្គសរុប',
      dataIndex: 'sessionsCount',
      key: 'sessionsCount',
      sorter: (a: any, b: any) => a.sessionsCount - b.sessionsCount,
    },
    {
      title: 'គ្រូកំពុងរៀន',
      dataIndex: 'menteeCount',
      key: 'menteeCount',
    },
    {
      title: 'ការវាយតម្លៃ',
      dataIndex: 'averageRating',
      key: 'averageRating',
      render: (rating: number) => (
        <Tag color="gold">⭐ {rating.toFixed(1)}</Tag>
      ),
    },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">វិភាគប្រព័ន្ធណែនាំ</h1>
        <Space>
          <Select
            value={filterType}
            onChange={setFilterType}
            style={{ width: 150 }}
          >
            <Option value="all">ទាំងអស់</Option>
            <Option value="province">តាមខេត្ត</Option>
            <Option value="district">តាមស្រុក</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            format={DATE_FORMATS.DISPLAY_DATE}
          />
          <ExportButton
            data={[analyticsData]}
            type="progress-reports"
            filename={`analytics-report-${formatDateForAPI(dateRange[0])}-to-${formatDateForAPI(dateRange[1])}`}
            title="របាយការណ៍វិភាគប្រព័ន្ធណែនាំ"
          />
        </Space>
      </div>

      {/* Overview Statistics */}
      <Row gutter={[32, 32]}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="ទំនាក់ទំនងសរុប"
              value={analyticsData.overview.totalRelationships}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="ទំនាក់ទំនងសកម្ម"
              value={analyticsData.overview.activeRelationships}
              valueStyle={{ color: '#3f8600' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="វគ្គសរុប"
              value={analyticsData.overview.totalSessions}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="វគ្គបានបញ្ចប់"
              value={analyticsData.overview.completedSessions}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="វគ្គ/ខែ"
              value={analyticsData.overview.averageSessionsPerMonth}
              precision={1}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="ការវាយតម្លៃមធ្យម"
              value={analyticsData.overview.averageRating}
              precision={1}
              suffix="/ 5"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row 1 */}
      <Row gutter={[32, 32]} className="mt-6">
        <Col xs={24} lg={12}>
          <Card title="វគ្គតាមប្រភេទ">
            <ReactECharts option={sessionTypeChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="និន្នាការវគ្គតាមខែ">
            <ReactECharts option={sessionTrendChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={[32, 32]} className="mt-6">
        <Col xs={24} lg={12}>
          <Card title="ការចែកចាយមតិយោបល់">
            <ReactECharts option={feedbackChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="វឌ្ឍនភាពតាមផ្នែកផ្តោតសំខាន់">
            {analyticsData.progressByFocusArea.map((item) => (
              <div key={item.area} className="mb-4">
                <div className="flex justify-between mb-1">
                  <span>{item.area}</span>
                  <span className="text-gray-500">{item.relationships} ទំនាក់ទំនង</span>
                </div>
                <Progress 
                  percent={item.completionRate} 
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* Top Mentors Table */}
      <Card title="គ្រូណែនាំពូកែ" className="mt-6">
        <Table
          columns={mentorColumns}
          dataSource={analyticsData.topMentors}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* Completion Rate by Province/District */}
      <Card title="អត្រាបញ្ចប់តាមតំបន់" className="mt-6">
        <Progress 
          percent={77} 
          status="active"
          format={(percent) => `${percent}% នៃវគ្គបានបញ្ចប់`}
        />
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-500">ខេត្តបន្ទាយមានជ័យ</p>
            <Progress percent={85} size="small" />
          </div>
          <div>
            <p className="text-gray-500">ខេត្តបាត់ដំបង</p>
            <Progress percent={72} size="small" />
          </div>
          <div>
            <p className="text-gray-500">ខេត្តសៀមរាប</p>
            <Progress percent={78} size="small" />
          </div>
        </div>
      </Card>
    </div>
  );
}