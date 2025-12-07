import { useEffect } from 'react'
import { Form, Input, DatePicker, Switch, Button, message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useUpdateEventMutation } from '../../features/admin/eventAPI'
import { CustomModal } from '../common'
import type { Event } from '../../types/Event'

interface UpdateEventModalProps {
  open: boolean
  onClose: () => void
  event: Event | null
}

const UpdateEventModal: React.FC<UpdateEventModalProps> = ({ open, onClose, event }) => {
  const [form] = Form.useForm()
  const [updateEvent, { isLoading }] = useUpdateEventMutation()

  useEffect(() => {
    if (open && event) {
      form.setFieldsValue({
        title: event.title,
        description: event.description || '',
        location: event.location || '',
        startDate: dayjs(event.startDate),
        endDate: dayjs(event.endDate),
        includedPromotions: event.includedPromotions || false,
      })
    } else if (open) {
      form.resetFields()
    }
  }, [open, event, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (!event?._id) {
        message.error('Không tìm thấy thông tin sự kiện')
        return
      }

      const eventData = {
        id: event._id,
        title: values.title,
        description: values.description || '',
        startDate: values.startDate.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        endDate: values.endDate.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        location: values.location || '',
        includedPromotions: values.includedPromotions || false,
      }

      await updateEvent(eventData).unwrap()
      message.success('Cập nhật sự kiện thành công')
      form.resetFields()
      onClose()
    } catch (error: any) {
      message.error(error?.data?.message || 'Cập nhật sự kiện thất bại')
    }
  }

  const disabledStartDate = (current: Dayjs) => {
    // Cho phép chọn ngày trong quá khứ nếu đó là ngày bắt đầu hiện tại của event
    if (event?.startDate) {
      const eventStartDate = dayjs(event.startDate).startOf('day')
      return current && current < eventStartDate
    }
    return current && current < dayjs().startOf('day')
  }

  const disabledEndDate = (current: Dayjs) => {
    const startDate = form.getFieldValue('startDate')
    if (!startDate) {
      // Nếu chưa chọn startDate, cho phép chọn ngày >= ngày kết thúc hiện tại của event
      if (event?.endDate) {
        const eventEndDate = dayjs(event.endDate).startOf('day')
        return current && current < eventEndDate
      }
      return current && current < dayjs().startOf('day')
    }
    return current && current < startDate.startOf('day')
  }

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Chỉnh sửa sự kiện"
      width={600}
      loading={isLoading}
      footer={
        <>
          <Button onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={isLoading}>
            Cập nhật
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

export default UpdateEventModal

