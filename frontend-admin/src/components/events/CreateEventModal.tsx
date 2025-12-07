import { useEffect } from 'react'
import { Form, Input, DatePicker, Switch, Button, message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useCreateEventMutation } from '../../features/admin/eventAPI'
import { CustomModal } from '../common'
import { getParkingLotId } from '../../utils/parkingLotId'
import { getUserData } from '../../utils/userData'

interface CreateEventModalProps {
  open: boolean
  onClose: () => void
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ open, onClose }) => {
  const operator = getUserData()
  const operatorId = operator?.id
  const [form] = Form.useForm()
  const [createEvent, { isLoading }] = useCreateEventMutation()

  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue({
        includedPromotions: false,
      })
    }
  }, [open, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const parkingLotId = getParkingLotId()

      if (!parkingLotId) {
        message.error('Không tìm thấy thông tin bãi đỗ xe')
        return
      }

      const eventData = {
        operatorId,
        title: values.title,
        description: values.description || '',
        startDate: values.startDate.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        endDate: values.endDate.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        location: values.location || '',
        includedPromotions: values.includedPromotions || false,
        parkingLotId,
      }

      await createEvent(eventData).unwrap()
      message.success('Tạo sự kiện thành công')
      form.resetFields()
      onClose()
    } catch (error: any) {
      message.error(error?.data?.message || 'Tạo sự kiện thất bại')
    }
  }

  const disabledStartDate = (current: Dayjs) => {
    return current && current < dayjs().startOf('day')
  }

  const disabledEndDate = (current: Dayjs) => {
    const startDate = form.getFieldValue('startDate')
    if (!startDate) {
      return current && current < dayjs().startOf('day')
    }
    return current && current < startDate.startOf('day')
  }

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Tạo mới sự kiện"
      width={600}
      loading={isLoading}
      footer={
        <>
          <Button onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={isLoading}>
            Tạo mới
          </Button>
        </>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label="Tên sự kiện"
          rules={[{ required: true, message: 'Vui lòng nhập tên sự kiện' }]}
        >
          <Input placeholder="Nhập tên sự kiện" />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <Input.TextArea
            placeholder="Nhập mô tả sự kiện"
            rows={4}
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          name="location"
          label="Địa điểm"
          rules={[{ required: true, message: 'Vui lòng nhập địa điểm' }]}
        >
          <Input placeholder="Nhập địa điểm tổ chức sự kiện" />
        </Form.Item>

        <Form.Item
          name="startDate"
          label="Ngày bắt đầu"
          rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            showTime
            format="DD/MM/YYYY HH:mm"
            placeholder="Chọn ngày và giờ bắt đầu"
            disabledDate={disabledStartDate}
          />
        </Form.Item>

        <Form.Item
          name="endDate"
          label="Ngày kết thúc"
          rules={[
            { required: true, message: 'Vui lòng chọn ngày kết thúc' },
            {
              validator: (_, value) => {
                const startDate = form.getFieldValue('startDate')
                if (!value || !startDate) {
                  return Promise.resolve()
                }
                if (value.isBefore(startDate) || value.isSame(startDate)) {
                  return Promise.reject(
                    new Error('Ngày kết thúc phải sau ngày bắt đầu')
                  )
                }
                return Promise.resolve()
              },
            },
          ]}
        >
          <DatePicker
            style={{ width: '100%' }}
            showTime
            format="DD/MM/YYYY HH:mm"
            placeholder="Chọn ngày và giờ kết thúc"
            disabledDate={disabledEndDate}
          />
        </Form.Item>

        <Form.Item
          name="includedPromotions"
          label="Bao gồm khuyến mãi"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </CustomModal>
  )
}

export default CreateEventModal

