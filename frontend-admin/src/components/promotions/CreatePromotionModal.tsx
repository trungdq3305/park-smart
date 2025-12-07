import { useEffect } from 'react'
import { Form, Input, InputNumber, DatePicker, Switch, Button, Select, message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useCreatePromotionMutation } from '../../features/operator/promotionAPI'
import { useGetEventsByOperatorQuery } from '../../features/admin/eventAPI'
import { CustomModal } from '../common'
import type { Event } from '../../types/Event'
interface CreatePromotionModalProps {
  open: boolean
  onClose: () => void
}

const CreatePromotionModal: React.FC<CreatePromotionModalProps> = ({ open, onClose }) => {
  const [form] = Form.useForm()
  const [createPromotion, { isLoading }] = useCreatePromotionMutation()
  const { data: eventsData } = useGetEventsByOperatorQuery({})
  const events: Event[] = Array.isArray(eventsData)
    ? eventsData
    : (eventsData as { data?: Event[] })?.data || []
  const discountType = Form.useWatch('discountType', form)

  const parseCurrency = (value: string | undefined): number => {
    if (!value) return 0
    const parsed = parseFloat(value.replace(/\$\s?|(,*)/g, ''))
    return isNaN(parsed) ? 0 : parsed
  }

  const parseNumber = (value: string | undefined): number => {
    if (!value) return 0
    const parsed = parseFloat(value.replace(/\$\s?|(,*)/g, ''))
    return isNaN(parsed) ? 0 : parsed
  }

  const formatPercentage = (value: number | undefined): string => {
    if (value === undefined || value === null) return ''
    return `${value}%`
  }

  const parsePercentage = (value: string | undefined): number => {
    if (!value) return 0
    const cleaned = value.replace(/%/g, '').trim()
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }

  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue({
        discountType: 'Percentage',
        isActive: true,
        totalUsageLimit: 10,
        maxDiscountAmount: 100000,
        discountValue: 10,
      })
    }
  }, [open, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      const discountValue = values.discountValue
      const promotionData = {
        eventId: values.eventId || null,
        code: values.code,
        name: values.name,
        description: values.description || '',
        discountType: values.discountType,
        discountValue: discountValue,
        maxDiscountAmount: values.maxDiscountAmount || 0,
        startDate: values.startDate.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        endDate: values.endDate.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        totalUsageLimit: values.totalUsageLimit || 10,
        isActive: values.isActive !== undefined ? values.isActive : true,
      }

      await createPromotion(promotionData).unwrap()
      message.success('Tạo khuyến mãi thành công')
      form.resetFields()
      onClose()
    } catch (error: any) {
      message.error(error?.data?.message || 'Tạo khuyến mãi thất bại')
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
      title="Tạo mới khuyến mãi"
      width={700}
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
      <Form form={form} layout="vertical" className="create-promotion-form">
        <Form.Item
          name="eventId"
          label="Sự kiện (tùy chọn)"
          tooltip="Chọn sự kiện để gắn khuyến mãi này, hoặc để trống nếu không gắn với sự kiện"
        >
          <Select
            placeholder="Chọn sự kiện (tùy chọn)"
            allowClear
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? '')
                .toString()
                .toLowerCase()
                .includes(input.toString().toLowerCase())
            }
          >
            {events.map((event: Event) => (
              <Select.Option key={event._id} value={event._id} label={event.title}>
                {event.title}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="code"
          label="Mã khuyến mãi"
          rules={[{ required: true, message: 'Vui lòng nhập mã khuyến mãi' }]}
        >
          <Input placeholder="Nhập mã khuyến mãi" />
        </Form.Item>

        <Form.Item
          name="name"
          label="Tên khuyến mãi"
          rules={[{ required: true, message: 'Vui lòng nhập tên khuyến mãi' }]}
        >
          <Input placeholder="Nhập tên khuyến mãi" />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={3} placeholder="Nhập mô tả khuyến mãi" />
        </Form.Item>

        <Form.Item
          name="discountType"
          label="Loại giảm giá"
          rules={[{ required: true, message: 'Vui lòng chọn loại giảm giá' }]}
        >
          <Select>
            <Select.Option value="Percentage">Phần trăm (%)</Select.Option>
            <Select.Option value="FixedAmount">Số tiền cố định (VND)</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="discountValue"
          label={discountType === 'Percentage' ? 'Phần trăm giảm giá' : 'Giá trị giảm giá (VND)'}
          rules={[
            { required: true, message: 'Vui lòng nhập giá trị giảm giá' },
            { type: 'number', min: 0.01, message: 'Giá trị phải lớn hơn 0' },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder={
              discountType === 'Percentage' ? 'Nhập phần trăm (ví dụ: 10)' : 'Nhập số tiền giảm giá'
            }
            min={0.01}
            step={discountType === 'Percentage' ? 1 : 0.01}
            precision={discountType === 'Percentage' ? 0 : 2}
            formatter={discountType === 'Percentage' ? formatPercentage : undefined}
            parser={discountType === 'Percentage' ? parsePercentage : undefined}
            addonAfter={discountType === 'Percentage' ? '%' : '₫'}
          />
        </Form.Item>

        <Form.Item
          name="maxDiscountAmount"
          label="Giảm tối đa (VND)"
          tooltip="Số tiền tối đa được giảm (0 = không giới hạn)"
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Nhập số tiền giảm tối đa"
            min={0}
            step={1000}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={parseCurrency}
          />
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
            placeholder="Chọn ngày bắt đầu"
            disabledDate={disabledStartDate}
          />
        </Form.Item>

        <Form.Item
          name="endDate"
          label="Ngày kết thúc"
          rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            showTime
            format="DD/MM/YYYY HH:mm"
            placeholder="Chọn ngày kết thúc"
            disabledDate={disabledEndDate}
          />
        </Form.Item>

        <Form.Item name="totalUsageLimit" label="Giới hạn sử dụng" tooltip="Số lượt sử dụng tối đa">
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Nhập số lượt sử dụng tối đa"
            min={1}
            step={1}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={parseNumber}
          />
        </Form.Item>

        <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
          <Switch checkedChildren="Hoạt động" unCheckedChildren="Vô hiệu" />
        </Form.Item>
      </Form>
    </CustomModal>
  )
}

export default CreatePromotionModal
