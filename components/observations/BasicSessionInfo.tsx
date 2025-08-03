'use client';

import { Form, Input, Select, Row, Col, Card, InputNumber, AutoComplete, Spin, Skeleton } from 'antd';
import { FormInstance } from 'antd/lib/form';
import { useState, useEffect, useMemo } from 'react';
import { debounce } from 'lodash';
import { isValidDisplayDate, formatDateForAPI, parseDateFromDisplay } from '@/lib/date-utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { observationFormTranslations } from '@/lib/translations/observation-form';

const { Option } = Select;
const { TextArea } = Input;

interface BasicSessionInfoProps {
  form: FormInstance;
  userRole?: string;
}

export default function BasicSessionInfo({ form, userRole }: BasicSessionInfoProps) {
  // Ensure form is available
  if (!form) {
    return null;
  }
  
  // Get current language and translations
  const { language } = useLanguage();
  const t = observationFormTranslations[language];

  // State for cascading dropdowns
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  
  // Loading states
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingCommunes, setLoadingCommunes] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [locationDataLoading, setLocationDataLoading] = useState(true);
  
  // Selected values
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedCommune, setSelectedCommune] = useState<string>('');
  const [schoolSearchTerm, setSchoolSearchTerm] = useState<string>('');
  // Fetch provinces on component mount
  useEffect(() => {
    fetchProvinces();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load schools when province changes
  useEffect(() => {
    if (selectedProvince) {
      searchSchools('', selectedProvince);
    }
  }, [selectedProvince]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch provinces
  const fetchProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const response = await fetch('/api/geographic/provinces');
      if (!response.ok) {
        throw new Error('Failed to fetch provinces');
      }
      const data = await response.json();
      setProvinces(data.provinces || []);
    } catch (error) {
      console.error('Error fetching provinces:', error);
      setProvinces([]);
    } finally {
      setLoadingProvinces(false);
    }
  };

  // Fetch districts when province changes
  const fetchDistricts = async (provinceCode: string) => {
    console.log('Fetching districts for province:', provinceCode);
    setLoadingDistricts(true);
    setDistricts([]);
    setCommunes([]);
    setVillages([]);
    try {
      const response = await fetch(`/api/geographic/districts?provinceCode=${provinceCode}`);
      if (!response.ok) {
        throw new Error('Failed to fetch districts');
      }
      const data = await response.json();
      console.log('Districts loaded:', data.districts?.length || 0);
      setDistricts(data.districts || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };

  // Fetch communes when district changes
  const fetchCommunes = async (districtCode: string) => {
    console.log('Fetching communes for district:', districtCode);
    setLoadingCommunes(true);
    setCommunes([]);
    setVillages([]);
    try {
      const response = await fetch(`/api/geographic/communes?districtCode=${districtCode}`);
      if (!response.ok) {
        throw new Error('Failed to fetch communes');
      }
      const data = await response.json();
      console.log('Communes loaded:', data.communes?.length || 0);
      setCommunes(data.communes || []);
    } catch (error) {
      console.error('Error fetching communes:', error);
      setCommunes([]);
    } finally {
      setLoadingCommunes(false);
    }
  };

  // Fetch villages when commune changes
  const fetchVillages = async (communeCode: string) => {
    setLoadingVillages(true);
    setVillages([]);
    try {
      const response = await fetch(`/api/geographic/villages?communeCode=${communeCode}`);
      if (!response.ok) {
        throw new Error('Failed to fetch villages');
      }
      const data = await response.json();
      setVillages(data.villages || []);
    } catch (error) {
      console.error('Error fetching villages:', error);
      setVillages([]);
    } finally {
      setLoadingVillages(false);
    }
  };

  // Search schools with debounce
  const searchSchools = useMemo(
    () => debounce(async (searchTerm: string, provinceCode?: string) => {
      setLoadingSchools(true);
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (provinceCode) params.append('provinceCode', provinceCode);
        
        const response = await fetch(`/api/schools/search?${params}`);
        const data = await response.json();
        setSchools(data.schools || []);
      } catch (error) {
        console.error('Error searching schools:', error);
        setSchools([]);
      } finally {
        setLoadingSchools(false);
      }
    }, 300),
    []
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      searchSchools.cancel();
    };
  }, [searchSchools]);

  // Simple load from draft - just set the values and load dropdowns
  useEffect(() => {
    const loadLocationData = async () => {
      const formValues = form.getFieldsValue();
      const provinceCode = formValues.provinceCode;
      const districtCode = formValues.districtCode;
      const communeCode = formValues.communeCode;
      const villageCode = formValues.villageCode;
      
      console.log('Form values on load:', { 
        provinceCode, 
        districtCode, 
        communeCode, 
        villageCode,
        district: formValues.district,
        commune: formValues.commune,
        village: formValues.village
      });
      
      // If we have location data from draft, load the necessary dropdowns
      if (provinceCode || districtCode || communeCode || villageCode) {
        console.log('Loading dropdowns for saved location data');
        setLocationDataLoading(true);
        
        try {
          // First set selected values
          if (provinceCode) {
            setSelectedProvince(String(provinceCode));
          }
          if (districtCode) {
            setSelectedDistrict(String(districtCode));
          }
          if (communeCode) {
            setSelectedCommune(String(communeCode));
          }
          
          // Then load dropdowns sequentially to ensure proper cascading
          if (provinceCode) {
            await fetchDistricts(String(provinceCode));
          }
          
          if (districtCode && provinceCode) {
            await fetchCommunes(String(districtCode));
          }
          
          if (communeCode && districtCode) {
            await fetchVillages(String(communeCode));
          }
          
        } catch (error) {
          console.error('Error loading location dropdowns:', error);
        } finally {
          setLocationDataLoading(false);
        }
      } else {
        setLocationDataLoading(false);
      }
    };
    
    // Run when provinces are loaded and form is ready
    if (provinces.length > 0 && form) {
      loadLocationData();
    }
  }, [provinces.length, form]); // Run when provinces load and form is ready
  
  // Fix display values when dropdowns are loaded
  useEffect(() => {
    const formValues = form.getFieldsValue();
    
    // Fix district display value if needed
    if (formValues.districtCode && districts.length > 0) {
      const district = districts.find(d => String(d.district_code) === String(formValues.districtCode));
      if (district && formValues.district !== `${district.district_name_en} / ${district.district_name_kh}`) {
        form.setFieldsValue({
          district: `${district.district_name_en} / ${district.district_name_kh}`
        });
      }
    }
  }, [districts, form]);
  
  useEffect(() => {
    const formValues = form.getFieldsValue();
    
    // Fix commune display value if needed
    if (formValues.communeCode && communes.length > 0) {
      const commune = communes.find(c => String(c.commune_code) === String(formValues.communeCode));
      if (commune && formValues.commune !== `${commune.commune_name_en} / ${commune.commune_name_kh}`) {
        form.setFieldsValue({
          commune: `${commune.commune_name_en} / ${commune.commune_name_kh}`
        });
      }
    }
  }, [communes, form]);
  
  useEffect(() => {
    const formValues = form.getFieldsValue();
    
    // Fix village display value if needed
    if (formValues.villageCode && villages.length > 0) {
      const village = villages.find(v => String(v.village_code) === String(formValues.villageCode));
      if (village && formValues.village !== `${village.village_name_en} / ${village.village_name_kh}`) {
        form.setFieldsValue({
          village: `${village.village_name_en} / ${village.village_name_kh}`
        });
      }
    }
  }, [villages, form]);

  // Helper function to format date input (DD-MM-YYYY)
  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    let value = rawValue.replace(/\D/g, ''); // Remove non-digits
    if (value.length >= 3) {
      value = value.slice(0, 2) + '-' + value.slice(2);
    }
    if (value.length >= 6) {
      value = value.slice(0, 5) + '-' + value.slice(5, 9);
    }
    // Update form field without modifying the event target
    if (form) {
      form.setFieldsValue({ inspectionDate: value });
    }
  };

  // Helper function to format time input
  const handleTimeInput = (fieldName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    let value = rawValue.replace(/\D/g, ''); // Remove non-digits
    if (value.length >= 3) {
      value = value.slice(0, 2) + ':' + value.slice(2, 4);
    }
    // Update form field without modifying the event target
    if (form) {
      form.setFieldsValue({ [fieldName]: value });
    }
  };

  // Handle province change
  const handleProvinceChange = (value: string) => {
    const province = provinces.find(p => String(p.province_code) === value);
    if (province) {
      setSelectedProvince(value);
      form.setFieldsValue({ 
        province: province.province_name_en,
        provinceNameKh: province.province_name_kh,
        // Clear downstream fields on user change
        district: undefined,
        districtCode: undefined,
        districtNameKh: undefined,
        commune: undefined,
        communeCode: undefined,
        communeNameKh: undefined,
        village: undefined,
        villageCode: undefined,
        villageNameKh: undefined,
        school: undefined,
        schoolId: undefined,
        cluster: undefined
      });
      fetchDistricts(value);
      // Search schools in this province
      searchSchools(schoolSearchTerm, value);
    }
  };

  // Handle district change
  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    // Clear downstream fields
    form.setFieldsValue({ 
      commune: undefined,
      communeCode: undefined,
      communeNameKh: undefined,
      village: undefined,
      villageCode: undefined,
      villageNameKh: undefined
    });
    fetchCommunes(value);
    // Don't filter schools by district - only province matters
  };

  // Handle commune change
  const handleCommuneChange = (value: string) => {
    setSelectedCommune(value);
    // Clear downstream fields
    form.setFieldsValue({ 
      village: undefined,
      villageCode: undefined,
      villageNameKh: undefined
    });
    fetchVillages(value);
    // Don't filter schools by commune - only province matters
  };

  // Handle village change
  const handleVillageChange = (value: string) => {
    // Village is handled in the onSelect of AutoComplete
  };

  // Handle school search
  const handleSchoolSearch = (value: string) => {
    setSchoolSearchTerm(value);
    searchSchools(value, selectedProvince);
  };

  // Handle school selection - no longer needed as it's inline

  return (
    <Card title={`${t.steps.basicInfo}`} className="mb-4">
      <Row gutter={[16, 16]}>
        {/* Location Information */}
        <Col span={24}>
          <h4 className="font-semibold mb-3">{t.locationInfo.title}</h4>
        </Col>
        
        <Col xs={24} md={8}>
          <Form.Item
            name="provinceCode"
            label={t.locationInfo.province}
            rules={[{ required: true, message: `${t.validation.pleaseSelect} ${t.locationInfo.province.toLowerCase()}` }]}
          >
            <Select 
              placeholder={t.locationInfo.selectProvince}
              loading={loadingProvinces}
              onChange={handleProvinceChange}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={provinces.map(p => ({
                value: String(p.province_code),
                label: `${p.province_name_en} / ${p.province_name_kh}`
              }))}
            />
          </Form.Item>
          <Form.Item name="province" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="provinceNameKh" hidden>
            <Input />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="district"
            label={t.locationInfo.district}
            rules={[{ required: true, message: `${t.validation.pleaseSelect} ${t.locationInfo.district.toLowerCase()}` }]}
          >
            <AutoComplete
              placeholder={t.locationInfo.selectDistrict}
              disabled={!selectedProvince}
              value={form.getFieldValue('district') || undefined}
              options={districts.map(d => ({
                value: `${d.district_name_en} / ${d.district_name_kh}`,
                label: `${d.district_name_en} / ${d.district_name_kh}`,
                districtData: d
              }))}
              onSelect={(value, option: any) => {
                const district = option.districtData;
                if (district) {
                  form.setFieldsValue({
                    districtCode: String(district.district_code),
                    district: `${district.district_name_en} / ${district.district_name_kh}`,
                    districtNameKh: district.district_name_kh
                  });
                  handleDistrictChange(String(district.district_code));
                }
              }}
              onChange={(value) => {
                if (!value) {
                  form.setFieldsValue({
                    districtCode: undefined,
                    district: undefined,
                    districtNameKh: undefined
                  });
                }
              }}
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase()) || false
              }
              notFoundContent={loadingDistricts ? <Spin size="small" /> : t.locationInfo.noDistrictsFound}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="districtCode" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="districtNameKh" hidden>
            <Input />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="commune"
            label={t.locationInfo.commune}
            rules={[{ required: true, message: `${t.validation.pleaseSelect} ${t.locationInfo.commune.toLowerCase()}` }]}
          >
            <AutoComplete
              placeholder={t.locationInfo.selectCommune}
              disabled={!selectedDistrict}
              value={form.getFieldValue('commune') || undefined}
              options={communes.map(c => ({
                value: `${c.commune_name_en} / ${c.commune_name_kh}`,
                label: `${c.commune_name_en} / ${c.commune_name_kh}`,
                communeData: c
              }))}
              onSelect={(value, option: any) => {
                const commune = option.communeData;
                if (commune) {
                  form.setFieldsValue({
                    communeCode: String(commune.commune_code),
                    commune: `${commune.commune_name_en} / ${commune.commune_name_kh}`,
                    communeNameKh: commune.commune_name_kh
                  });
                  handleCommuneChange(String(commune.commune_code));
                }
              }}
              onChange={(value) => {
                if (!value) {
                  form.setFieldsValue({
                    communeCode: undefined,
                    commune: undefined,
                    communeNameKh: undefined
                  });
                }
              }}
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase()) || false
              }
              notFoundContent={loadingCommunes ? <Spin size="small" /> : t.locationInfo.noCommunesFound}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="communeCode" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="communeNameKh" hidden>
            <Input />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="village"
            label={t.locationInfo.village}
          >
            <AutoComplete
              placeholder={t.locationInfo.selectVillage}
              disabled={!selectedCommune}
              value={form.getFieldValue('village') || undefined}
              options={villages.map(v => ({
                value: `${v.village_name_en} / ${v.village_name_kh}`,
                label: `${v.village_name_en} / ${v.village_name_kh}`,
                villageData: v
              }))}
              onSelect={(value, option: any) => {
                const village = option.villageData;
                if (village) {
                  form.setFieldsValue({
                    villageCode: String(village.village_code),
                    village: `${village.village_name_en} / ${village.village_name_kh}`,
                    villageNameKh: village.village_name_kh
                  });
                  handleVillageChange(String(village.village_code));
                }
              }}
              onChange={(value) => {
                if (!value) {
                  form.setFieldsValue({
                    villageCode: undefined,
                    village: undefined,
                    villageNameKh: undefined
                  });
                }
              }}
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase()) || false
              }
              notFoundContent={loadingVillages ? <Spin size="small" /> : t.locationInfo.noVillagesFound}
              style={{ width: '100%' }}
              allowClear
            />
          </Form.Item>
          <Form.Item name="villageCode" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="villageNameKh" hidden>
            <Input />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="cluster"
            label={t.locationInfo.cluster}
          >
            <Input placeholder={t.locationInfo.autoFilledFromSchool} disabled />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="school"
            label={t.locationInfo.school}
            rules={[{ required: true, message: `${t.validation.pleaseSelect} ${t.locationInfo.school.toLowerCase()}` }]}
          >
            <AutoComplete
              placeholder={selectedProvince ? t.locationInfo.selectSchool : t.locationInfo.pleaseSelectProvinceFirst}
              disabled={!selectedProvince}
              value={form.getFieldValue('school') || undefined}
              options={schools.map(s => ({
                value: String(s.id),
                label: s.name,
                schoolData: s
              }))}
              onSearch={handleSchoolSearch}
              onSelect={(value, option: any) => {
                const school = option.schoolData;
                if (school) {
                  form.setFieldsValue({
                    schoolId: school.id,
                    school: school.name,
                    cluster: school.cluster || undefined
                  });
                }
              }}
              onChange={(value) => {
                // Clear the school ID if the value is manually changed
                if (!value) {
                  form.setFieldsValue({
                    schoolId: undefined,
                    school: undefined,
                    cluster: undefined
                  });
                }
              }}
              onFocus={() => {
                // Load schools when dropdown is focused if province is selected
                if (selectedProvince && schools.length === 0) {
                  searchSchools('', selectedProvince);
                }
              }}
              notFoundContent={loadingSchools ? <Spin size="small" /> : t.locationInfo.noSchoolsFound}
              style={{ width: '100%' }}
              popupMatchSelectWidth={true}
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase()) || false
              }
            />
          </Form.Item>
          <Form.Item name="schoolId" hidden>
            <Input />
          </Form.Item>
        </Col>

        {/* Teacher Information */}
        <Col span={24}>
          <h4 className="font-semibold mb-3 mt-4">{t.teacherInfo.title}</h4>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="nameOfTeacher"
            label={t.teacherInfo.name}
            rules={[{ required: true, message: `${t.validation.pleaseEnter} ${t.teacherInfo.name.toLowerCase()}` }]}
          >
            <Input placeholder={t.teacherInfo.enterTeacherName} />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="sex"
            label={t.teacherInfo.gender}
            rules={[{ required: true, message: `${t.validation.pleaseSelect} ${t.teacherInfo.gender.toLowerCase()}` }]}
          >
            <Select placeholder={t.teacherInfo.selectGender}>
              <Option value="M">{t.teacherInfo.male}</Option>
              <Option value="F">{t.teacherInfo.female}</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="employmentType"
            label={t.teacherInfo.employmentType}
            rules={[{ required: true, message: `${t.validation.pleaseSelect} ${t.teacherInfo.employmentType.toLowerCase()}` }]}
          >
            <Select placeholder={t.teacherInfo.selectEmploymentType}>
              <Option value="official">{t.teacherInfo.official}</Option>
              <Option value="contract">{t.teacherInfo.contract}</Option>
            </Select>
          </Form.Item>
        </Col>

        {/* Schedule Information */}
        <Col span={24}>
          <h4 className="font-semibold mb-3 mt-4">{t.scheduleInfo.title}</h4>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="inspectionDate"
            label={t.scheduleInfo.inspectionDate}
            rules={[
              { required: true, message: `${t.validation.pleaseEnter} ${t.scheduleInfo.inspectionDate.toLowerCase()}` },
              {
                pattern: /^\d{2}-\d{2}-\d{4}$/,
                message: `${t.validation.pleaseEnter} ${t.scheduleInfo.dateFormat}`
              },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  if (!isValidDisplayDate(value)) {
                    return Promise.reject(new Error(t.scheduleInfo.invalidDate));
                  }
                  const parsedDate = parseDateFromDisplay(value);
                  if (!parsedDate) {
                    return Promise.reject(new Error(t.scheduleInfo.invalidDate));
                  }
                  if (parsedDate.isAfter(new Date())) {
                    return Promise.reject(new Error(t.scheduleInfo.dateCannotBeFuture));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input 
              placeholder={t.scheduleInfo.dateFormat} 
              style={{ width: '100%' }}
              maxLength={10}
              onChange={handleDateInput}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="sessionTime"
            label={t.scheduleInfo.sessionTime}
            rules={[{ required: true, message: `${t.validation.pleaseSelect} ${t.scheduleInfo.sessionTime.toLowerCase()}` }]}
          >
            <Select placeholder={t.scheduleInfo.selectSessionTime}>
              <Option value="morning">{t.scheduleInfo.morning}</Option>
              <Option value="afternoon">{t.scheduleInfo.afternoon}</Option>
              <Option value="both">{t.scheduleInfo.both}</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="startTime"
            label={t.scheduleInfo.startTime}
            rules={[
              {
                pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                message: t.scheduleInfo.invalidTimeFormat
              }
            ]}
          >
            <Input 
              placeholder={t.scheduleInfo.timeFormat} 
              style={{ width: '100%' }}
              maxLength={5}
              onChange={handleTimeInput('startTime')}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="endTime"
            label={t.scheduleInfo.endTime}
            rules={[
              {
                pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                message: t.scheduleInfo.invalidTimeFormat
              }
            ]}
          >
            <Input 
              placeholder={t.scheduleInfo.timeFormat} 
              style={{ width: '100%' }}
              maxLength={5}
              onChange={handleTimeInput('endTime')}
            />
          </Form.Item>
        </Col>

        {/* Lesson Information */}
        <Col span={24}>
          <h4 className="font-semibold mb-3 mt-4">{t.lessonInfo.title}</h4>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="subject"
            label={t.lessonInfo.subject}
            rules={[{ required: true, message: `${t.validation.pleaseEnter} ${t.lessonInfo.subject.toLowerCase()}` }]}
          >
            <Input placeholder={t.lessonInfo.enterSubject} />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="grade"
            label={t.lessonInfo.grade}
            rules={[{ required: true, message: `${t.validation.pleaseSelect} ${t.lessonInfo.grade.toLowerCase()}` }]}
          >
            <Select placeholder={t.lessonInfo.selectGrade}>
              <Option value={4}>{t.lessonInfo.gradeNumber} 4</Option>
              <Option value={5}>{t.lessonInfo.gradeNumber} 5</Option>
              <Option value={6}>{t.lessonInfo.gradeNumber} 6</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="chapter"
            label={t.lessonInfo.chapter}
          >
            <Input placeholder={t.lessonInfo.enterChapter} />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="lesson"
            label={t.lessonInfo.lesson}
          >
            <Input placeholder={t.lessonInfo.enterLesson} />
          </Form.Item>
        </Col>

        <Col xs={24} md={16}>
          <Form.Item
            name="title"
            label={t.lessonInfo.lessonTitle}
          >
            <Input placeholder={t.lessonInfo.enterLessonTitle} />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            name="subTitle"
            label={t.lessonInfo.lessonSubTitle}
          >
            <Input placeholder={t.lessonInfo.enterLessonSubTitle} />
          </Form.Item>
        </Col>

        {/* Student Statistics */}
        <Col span={24}>
          <h4 className="font-semibold mb-3 mt-4">{t.studentStats.title}</h4>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            name="totalMale"
            label={t.studentStats.totalMale}
            rules={[
              { required: true, message: `${t.validation.pleaseEnter} ${t.studentStats.totalMale.toLowerCase()}` },
              { type: 'number', message: t.validation.mustBeNumber }
            ]}
            initialValue={0}
          >
            <InputNumber 
              min={0}
              max={9999}
              style={{ width: '100%' }}
              placeholder="0"
              // Only allow numeric input
              formatter={value => `${value}`.replace(/\D/g, '')}
              parser={value => (parseInt(value!.replace(/\D/g, ''), 10) || 0) as any}
              // Prevent non-numeric keyboard input
              onKeyPress={(e) => {
                const charCode = e.which ? e.which : e.keyCode;
                if (charCode > 31 && (charCode < 48 || charCode > 57)) {
                  e.preventDefault();
                }
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            name="totalFemale"
            label={t.studentStats.totalFemale}
            rules={[
              { required: true, message: `${t.validation.pleaseEnter} ${t.studentStats.totalFemale.toLowerCase()}` },
              { type: 'number', message: t.validation.mustBeNumber }
            ]}
            initialValue={0}
          >
            <InputNumber 
              min={0}
              max={9999}
              style={{ width: '100%' }}
              placeholder="0"
              // Only allow numeric input
              formatter={value => `${value}`.replace(/\D/g, '')}
              parser={value => (parseInt(value!.replace(/\D/g, ''), 10) || 0) as any}
              // Prevent non-numeric keyboard input
              onKeyPress={(e) => {
                const charCode = e.which ? e.which : e.keyCode;
                if (charCode > 31 && (charCode < 48 || charCode > 57)) {
                  e.preventDefault();
                }
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            name="totalAbsent"
            label={t.studentStats.totalAbsent}
            rules={[
              { required: true, message: `${t.validation.pleaseEnter} ${t.studentStats.totalAbsent.toLowerCase()}` },
              { type: 'number', message: t.validation.mustBeNumber }
            ]}
            initialValue={0}
          >
            <InputNumber 
              min={0}
              max={9999}
              style={{ width: '100%' }}
              placeholder="0"
              // Only allow numeric input
              formatter={value => `${value}`.replace(/\D/g, '')}
              parser={value => (parseInt(value!.replace(/\D/g, ''), 10) || 0) as any}
              // Prevent non-numeric keyboard input
              onKeyPress={(e) => {
                const charCode = e.which ? e.which : e.keyCode;
                if (charCode > 31 && (charCode < 48 || charCode > 57)) {
                  e.preventDefault();
                }
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            name="totalAbsentFemale"
            label={t.studentStats.absentFemale}
            rules={[
              { required: true, message: `${t.validation.pleaseEnter} ${t.studentStats.absentFemale.toLowerCase()}` },
              { type: 'number', message: t.validation.mustBeNumber }
            ]}
            initialValue={0}
          >
            <InputNumber 
              min={0}
              max={9999}
              style={{ width: '100%' }}
              placeholder="0"
              // Only allow numeric input
              formatter={value => `${value}`.replace(/\D/g, '')}
              parser={value => (parseInt(value!.replace(/\D/g, ''), 10) || 0) as any}
              // Prevent non-numeric keyboard input
              onKeyPress={(e) => {
                const charCode = e.which ? e.which : e.keyCode;
                if (charCode > 31 && (charCode < 48 || charCode > 57)) {
                  e.preventDefault();
                }
              }}
            />
          </Form.Item>
        </Col>

        {/* Inspector Information - Only for certain roles */}
        {['ADMIN', 'DIRECTOR', 'MENTOR', 'OFFICER'].includes(userRole || '') && (
          <>
            <Col span={24}>
              <h4 className="font-semibold mb-3 mt-4">{t.inspectorInfo.title}</h4>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="inspectorName"
                label={t.inspectorInfo.name}
              >
                <Input placeholder={t.inspectorInfo.enterName} />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="inspectorPosition"
                label={t.inspectorInfo.position}
              >
                <Input placeholder={t.inspectorInfo.enterPosition} />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="inspectorOrganization"
                label={t.inspectorInfo.organization}
              >
                <Input placeholder={t.inspectorInfo.enterOrganization} />
              </Form.Item>
            </Col>
          </>
        )}

        {/* Additional Information */}
        <Col span={24}>
          <h4 className="font-semibold mb-3 mt-4">{t.additionalInfo.title}</h4>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="academicYear"
            label={t.additionalInfo.academicYear}
          >
            <Input placeholder={t.additionalInfo.academicYearPlaceholder} />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="semester"
            label={t.additionalInfo.semester}
          >
            <Select placeholder={t.additionalInfo.selectSemester}>
              <Option value={1}>{t.additionalInfo.semester1}</Option>
              <Option value={2}>{t.additionalInfo.semester2}</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="lessonDurationMinutes"
            label={t.additionalInfo.lessonDurationMinutes}
          >
            <InputNumber 
              min={0}
              max={999}
              style={{ width: '100%' }}
              placeholder={t.additionalInfo.durationPlaceholder}
              // Only allow numeric input
              formatter={value => `${value}`.replace(/\D/g, '')}
              parser={value => (parseInt(value!.replace(/\D/g, ''), 10) || 0) as any}
              // Prevent non-numeric keyboard input
              onKeyPress={(e) => {
                const charCode = e.which ? e.which : e.keyCode;
                if (charCode > 31 && (charCode < 48 || charCode > 57)) {
                  e.preventDefault();
                }
              }}
            />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            name="generalNotes"
            label={t.additionalInfo.generalNotes}
          >
            <TextArea 
              rows={4} 
              placeholder={t.additionalInfo.notesPlaceholder}
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
}