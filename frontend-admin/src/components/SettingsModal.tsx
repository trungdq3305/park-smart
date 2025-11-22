import { useState, useEffect } from 'react'
import { Modal, Input, Button, Form, message } from 'antd'
import { SettingOutlined } from '@ant-design/icons'

interface SettingsModalProps {
  currentUrl: string
  onSave: (url: string) => void
}

const SettingsModal: React.FC<SettingsModalProps> = ({ currentUrl, onSave }) => {
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      form.setFieldsValue({ gatewayUrl: currentUrl })
    }
  }, [open, currentUrl, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      onSave(values.gatewayUrl)
      setOpen(false)
      message.success('Đã lưu cấu hình. Trang sẽ tự động tải lại...')
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  return (
    <>
      <Button
        type="text"
        icon={<SettingOutlined />}
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          color: '#1890ff',
          fontSize: 24,
        }}
        title="Cài đặt"
      />
      <Modal
        title="Cài đặt Gateway"
        open={open}
        onCancel={() => setOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setOpen(false)}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit}>
            Lưu và Áp dụng
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="gatewayUrl"
            label="URL Gateway Python"
            rules={[
              { required: true, message: 'Vui lòng nhập URL' },
              {
                pattern: /^https?:\/\/.+/,
                message: 'URL phải bắt đầu bằng http:// hoặc https://',
              },
            ]}
          >
            <Input placeholder="http://localhost:1836" />
          </Form.Item>
          <p style={{ color: '#888', fontSize: 12 }}>
            Lưu ý: Sau khi lưu, trang sẽ tự động tải lại để áp dụng cấu hình mới.
          </p>
        </Form>
      </Modal>
    </>
  )
}

export default SettingsModal

