import React, { useMemo, useState } from 'react'
import {
  useCreateTermsPolicyMutation,
  useDeleteTermsPolicyMutation,
  useGetTermsPoliciesQuery,
  useUpdateTermsPolicyMutation,
} from '../../../features/admin/termsAPI'
import type { TermPolicy } from '../../../types/TAPs'
import TermsPolicyModal, {
  type TermsPolicyFormValues,
} from '../../../components/modals/TermsPolicyModal'
import './ManageTermsPolicies.css'

interface TermsPoliciesResponse {
  data: {
    data: TermPolicy[]
  }
  isLoading: boolean
}

const ManageTermsPolicies: React.FC = () => {
  const { data: termsPolicies, isLoading } = useGetTermsPoliciesQuery<TermsPoliciesResponse>({})
  const [createTermsPolicy, { isLoading: isCreating }] = useCreateTermsPolicyMutation()
  const [updateTermsPolicy, { isLoading: isUpdating }] = useUpdateTermsPolicyMutation()
  const [deleteTermsPolicy, { isLoading: isDeleting }] = useDeleteTermsPolicyMutation()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TermPolicy | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const termsPoliciesData = termsPolicies?.data || []

  const totalPolicies = termsPoliciesData.length

  const lastUpdated = useMemo(() => {
    if (!termsPoliciesData.length) return null
    const latest = [...termsPoliciesData].sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0).getTime() -
        new Date(a.updatedAt || a.createdAt || 0).getTime()
    )[0]
    return latest?.updatedAt || latest?.createdAt
  }, [termsPoliciesData])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 2400)
  }

  const openCreate = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const openEdit = (record: TermPolicy) => {
    setEditingItem(record)
    setIsModalOpen(true)
  }

  const handleSubmit = async (values: TermsPolicyFormValues) => {
    try {
      if (editingItem) {
        await updateTermsPolicy({ id: editingItem.id, ...values }).unwrap()
        showToast('success', 'Cập nhật thành công')
      } else {
        await createTermsPolicy(values).unwrap()
        showToast('success', 'Tạo mới thành công')
      }
      setIsModalOpen(false)
    } catch (err: unknown) {
      const apiMsg =
        (err as { data?: { message: string }; error?: string })?.data?.message ||
        (err as { error?: string })?.error ||
        'Có lỗi xảy ra'
      showToast('error', apiMsg)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Xoá mục này? Hành động không thể hoàn tác.')
    if (!confirmed) return
    try {
      await deleteTermsPolicy(id).unwrap()
      showToast('success', 'Đã xoá')
    } catch (err: unknown) {
      const apiMsg =
        (err as { data?: { message: string }; error?: string })?.data?.message ||
        (err as { error?: string })?.error ||
        'Xoá thất bại'
      showToast('error', apiMsg)
    }
  }

  const formatDate = (value?: string) => {
    if (!value) return '-'
    return new Date(value).toLocaleString('vi-VN')
  }

  return (
    <div className="tp-page-new">
      <div className="tp-hero">
        <div>
          <p className="tp-kicker">Admin • Terms & Policies</p>
          <h1>Quản lý điều khoản & chính sách</h1>
          <p className="tp-subtitle">Tạo, cập nhật, xoá và theo dõi các điều khoản của hệ thống</p>
          <div className="tp-hero-badges">
            <span className="tp-badge">Tổng {totalPolicies} mục</span>
            {lastUpdated && (
              <span className="tp-badge ghost">Cập nhật gần nhất: {formatDate(lastUpdated)}</span>
            )}
          </div>
        </div>
        <div className="tp-hero-actions">
          <button
            className="tp-btn primary"
            onClick={openCreate}
            disabled={isCreating || isUpdating}
          >
            + Thêm mới
          </button>
        </div>
      </div>

      <div className="tp-panel">
        <div className="tp-panel-header">
          <div>
            <h3>Danh sách terms & policies</h3>
            <p>Quản lý nội dung công bố tới người dùng</p>
          </div>
          <div className="tp-status-group">
            <span className="tp-chip neutral">Đang tải: {isLoading ? 'Có' : 'Không'}</span>
            <span className="tp-chip info">Đang chỉnh sửa: {editingItem ? 'Có' : 'Không'}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="tp-loading">
            <div className="spinner" />
            <p>Đang tải danh sách...</p>
          </div>
        ) : termsPoliciesData.length === 0 ? (
          <div className="tp-empty">
            <p>Chưa có điều khoản/chính sách nào.</p>
            <button className="tp-btn ghost" onClick={openCreate}>
              Thêm mới
            </button>
          </div>
        ) : (
          <div className="tp-grid">
            {termsPoliciesData.map((item) => (
              <div className="tp-card" key={item.id}>
                <div className="tp-card-top">
                  <div className="tp-avatar">{item.title?.slice(0, 1) || 'T'}</div>
                  <div className="tp-card-meta">
                    <div className="tp-card-title">{item.title}</div>
                    <div className="tp-card-desc" title={item.description}>
                      {item.description}
                    </div>
                  </div>
                </div>
                <div className="tp-card-body">
                  <div className="tp-card-row">
                    <span className="tp-label">ID</span>
                    <span className="tp-value muted">{item.id}</span>
                  </div>
                  <div className="tp-card-row">
                    <span className="tp-label">Cập nhật</span>
                    <span className="tp-value">{formatDate(item.updatedAt || item.createdAt)}</span>
                  </div>
                </div>
                <div className="tp-card-actions">
                  <button
                    className="tp-btn ghost"
                    onClick={() => openEdit(item)}
                    disabled={isUpdating || isCreating}
                  >
                    Sửa
                  </button>
                  <button
                    className="tp-btn danger"
                    onClick={() => handleDelete(item.id)}
                    disabled={isDeleting || isUpdating || isCreating}
                  >
                    Xoá
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <div className={`tp-toast ${toast.type}`}>{toast.message}</div>}

      <TermsPolicyModal
        open={isModalOpen}
        loading={isCreating || isUpdating}
        title={editingItem ? 'Chỉnh sửa điều khoản/chính sách' : 'Tạo điều khoản/chính sách'}
        okText={editingItem ? 'Lưu thay đổi' : 'Tạo mới'}
        initialValues={{
          title: editingItem?.title || '',
          description: editingItem?.description || '',
          content: editingItem?.content || '',
        }}
        onCancel={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

export default ManageTermsPolicies
