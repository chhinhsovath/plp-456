'use client';

import { Form } from 'antd';
import { FormInstance } from 'antd/es/form';
import { useEffect, useRef, useState } from 'react';

/**
 * A wrapper around Ant Design's useForm that prevents the 
 * "Instance created by `useForm` is not connected" warning
 */
export function useSafeForm<Values = any>(): [FormInstance<Values>, boolean] {
  const [form] = Form.useForm<Values>();
  const [isReady, setIsReady] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    // Delay form readiness to ensure proper mounting
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        setIsReady(true);
      }
    }, 0);

    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
    };
  }, []);

  return [form, isReady];
}