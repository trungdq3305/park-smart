//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}

//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}




//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)

//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
/////using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}

//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}




//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)

//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
/////using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}

//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}




//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)

//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
/////using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}

//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}




//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)

//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
/////using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}

//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}




//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)

//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
/////using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}

//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}




//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)

//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
/////using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}

//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}




//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)

//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
/////using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}

//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}


//// ==============================================================================
//// PHẦN 3: CÁC LỚP DỊCH VỤ QUẢN LÝ (SERVICE CLASSES)
//// ==============================================================================

//public abstract class QuanLyBase<T> : IQuanLy<T> where T : IQueryableObject
//{
//    protected List<T> DanhSach = new List<T>();

//    public void Them(T doiTuong)
//    {
//        if (doiTuong.Id <= 0)
//        {
//            // Tự động tạo ID đơn giản
//            doiTuong.Id = DanhSach.Any() ? DanhSach.Max(d => d.Id) + 1 : 1;
//        }
//        DanhSach.Add(doiTuong);
//        Console.WriteLine($"Đã thêm thành công đối tượng {typeof(T).Name} có ID: {doiTuong.Id}");
//    }

//    public T TimTheoId(int id)
//    {
//        return DanhSach.FirstOrDefault(d => d.Id == id);
//    }

//    public List<T> TimTatCa()
//    {
//        return DanhSach;
//    }

//    public bool Xoa(int id)
//    {
//        var doiTuong = TimTheoId(id);
//        if (doiTuong != null)
//        {
//            DanhSach.Remove(doiTuong);
//            Console.WriteLine($"Đã xóa thành công đối tượng {typeof(T).Name} có ID: {id}");
//            return true;
//        }
//        Console.WriteLine($"Không tìm thấy đối tượng {typeof(T).Name} có ID: {id} để xóa.");
//        return false;
//    }
//}

//public class QuanLySach : QuanLyBase<Sach>
//{
//    // Thêm logic riêng cho việc quản lý sách
//    public List<Sach> TimSachSanCo()
//    {
//        return DanhSach.Where(s => s.TrangThai == TrangThaiSach.SanCo).ToList();
//    }

//    public bool CapNhatTrangThai(int id, TrangThaiSach trangThaiMoi)
//    {
//        var sach = TimTheoId(id);
//        if (sach != null)
//        {
//            sach.TrangThai = trangThaiMoi;
//            Console.WriteLine($"Cập nhật trạng thái sách ID {id} thành: {trangThaiMoi}");
//            return true;
//        }
//        return false;
//    }
//}

//public class QuanLyDocGia : QuanLyBase<DocGia> { }
//public class QuanLyTacGia : QuanLyBase<TacGia> { }


//// ==============================================================================
//// PHẦN 4: LOGIC NGHIỆP VỤ (HỆ THỐNG)
//// ==============================================================================

//public class HeThongThuVien
//{
//    private QuanLySach QLSach = new QuanLySach();
//    private QuanLyDocGia QLDocGia = new QuanLyDocGia();
//    private QuanLyTacGia QLTacGia = new QuanLyTacGia();

//    public void KhoiTaoDuLieuMau()
//    {
//        Console.WriteLine("\n--- Khởi tạo Dữ liệu Mẫu ---");

//        var tg1 = new TacGia(1, "Nguyễn Nhật Ánh", "Việt Nam", new DateTime(1955, 5, 7));
//        var tg2 = new TacGia(2, "Haruki Murakami", "Nhật Bản", new DateTime(1949, 1, 12));
//        QLTacGia.Them(tg1);
//        QLTacGia.Them(tg2);

//        QLSach.Them(new Sach(1, "Tôi Thấy Hoa Vàng Trên Cỏ Xanh", 2010, "978-604-55-5205-0", tg1));
//        QLSach.Them(new Sach(2, "Rừng Na Uy", 1987, "978-0375701898", tg2));
//        QLSach.Them(new Sach(3, "Mắt Biếc", 1990, "978-604-55-5206-7", tg1));
//        QLSach.Them(new Sach(4, "Kafka bên bờ biển", 2002, "978-0099458321", tg2));

//        QLDocGia.Them(new DocGia(101, "Phạm Văn Khang", "Hà Nội", "0901234567"));
//        QLDocGia.Them(new DocGia(102, "Lê Thị Thu", "TP.HCM", "0987654321"));
//    }

//    public void ChoMuonSach(int docGiaId, int sachId)
//    {
//        Console.WriteLine($"\n--- Thực hiện cho mượn Sách ID {sachId} cho Độc giả ID {docGiaId} ---");
//        var docGia = QLDocGia.TimTheoId(docGiaId);
//        var sach = QLSach.TimTheoId(sachId);

//        if (docGia == null || sach == null)
//        {
//            Console.WriteLine("Lỗi: Độc giả hoặc Sách không tồn tại.");
//            return;
//        }

//        if (sach.TrangThai != TrangThaiSach.SanCo)
//        {
//            Console.WriteLine($"Lỗi: Sách '{sach.TieuDe}' hiện không Sẵn có. Trạng thái: {sach.TrangThai}");
//            return;
//        }

//        // Cập nhật trạng thái và danh sách mượn
//        QLSach.CapNhatTrangThai(sachId, TrangThaiSach.DaMuon);
//        docGia.SachDangMuon.Add(sachId);
//        Console.WriteLine($"Thành công: Độc giả {docGia.HoTen} đã mượn sách '{sach.TieuDe}'.");
//    }

//    public void HienThiBaoCao()
//    {
//        Console.WriteLine("\n--- BÁO CÁO TỔNG HỢP THƯ VIỆN ---");
//        Console.WriteLine($"Tổng số Sách: {QLSach.TimTatCa().Count}");
//        Console.WriteLine($"Tổng số Độc giả: {QLDocGia.TimTatCa().Count}");

//        int sachDaMuon = QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.DaMuon);
//        Console.WriteLine($"Sách Đang mượn: {sachDaMuon}");
//        Console.WriteLine($"Sách Sẵn có: {QLSach.TimTatCa().Count(s => s.TrangThai == TrangThaiSach.SanCo)}");
//    }
//}


//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//using System;
//using System.Collections.Generic;
//using System.Linq;

//// ==============================================================================
//// PHẦN 1: CÁC GIAO DIỆN (INTERFACES) VÀ ENUM
//// ==============================================================================

//// Enum định nghĩa trạng thái của một cuốn sách
//public enum TrangThaiSach
//{
//    SanCo,
//    DaMuon,
//    BaoTri,
//    Mat
//}

//// Giao diện cơ bản cho các đối tượng có thể truy vấn
//public interface IQueryableObject
//{
//    int Id { get; set; }
//    void HienThiChiTiet();
//}

//// Giao diện cho các dịch vụ quản lý (thêm, xóa, tìm)
//public interface IQuanLy<T> where T : IQueryableObject
//{
//    void Them(T doiTuong);
//    T TimTheoId(int id);
//    List<T> TimTatCa();
//    bool Xoa(int id);
//}


//// ==============================================================================
//// PHẦN 2: CÁC LỚP ĐỐI TƯỢNG (MODEL CLASSES)
//// ==============================================================================

//public class TacGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string Ten { get; set; }
//    public string QuocGia { get; set; }
//    public DateTime NgaySinh { get; set; }

//    public TacGia(int id, string ten, string quocGia, DateTime ngaySinh)
//    {
//        Id = id;
//        Ten = ten;
//        QuocGia = quocGia;
//        NgaySinh = ngaySinh;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Tác Giả] ID: {Id}, Tên: {Ten}, Quốc gia: {QuocGia}, Sinh: {NgaySinh:dd/MM/yyyy}");
//    }
//}

//public class Sach : IQueryableObject
//{
//    public int Id { get; set; }
//    public string TieuDe { get; set; }
//    public int NamXuatBan { get; set; }
//    public string ISBN { get; set; }
//    public TrangThaiSach TrangThai { get; set; }
//    public TacGia TacGiaChinh { get; set; }

//    public Sach(int id, string tieuDe, int namXB, string isbn, TacGia tacGia)
//    {
//        Id = id;
//        TieuDe = tieuDe;
//        NamXuatBan = namXB;
//        ISBN = isbn;
//        TacGiaChinh = tacGia;
//        TrangThai = TrangThaiSach.SanCo; // Mặc định là Sẵn có
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Sách] ID: {Id}, Tiêu đề: {TieuDe}, Tác giả: {TacGiaChinh.Ten}, Trạng thái: {TrangThai}");
//    }
//}

//public class DocGia : IQueryableObject
//{
//    public int Id { get; set; }
//    public string HoTen { get; set; }
//    public string DiaChi { get; set; }
//    public string SoDienThoai { get; set; }
//    public List<int> SachDangMuon { get; set; } = new List<int>();

//    public DocGia(int id, string hoTen, string diaChi, string sdt)
//    {
//        Id = id;
//        HoTen = hoTen;
//        DiaChi = diaChi;
//        SoDienThoai = sdt;
//    }

//    public void HienThiChiTiet()
//    {
//        Console.WriteLine($"[Độc Giả] ID: {Id}, Tên: {HoTen}, Đang mượn: {SachDangMuon.Count} cuốn.");
//    }
//}




//// ==============================================================================
//// PHẦN 5: CHƯƠNG TRÌNH CHÍNH (MAIN PROGRAM)
//// ==============================================================================

//public class Program
//{
//    public static void Main(string[] args)
//    {
//        HeThongThuVien heThong = new HeThongThuVien();
//        heThong.KhoiTaoDuLieuMau();

//        // 1. Thực hiện mượn sách
//        heThong.ChoMuonSach(101, 1); // Khang mượn 'Tôi Thấy Hoa Vàng...'
//        heThong.ChoMuonSach(102, 3); // Thu mượn 'Mắt Biếc'
//        heThong.ChoMuonSach(101, 2); // Khang mượn 'Rừng Na Uy'

//        // 2. Kiểm tra lại trạng thái
//        heThong.HienThiBaoCao();

//        //Console.WriteLine("\n--- Chi tiết Độc giả 101 ---");
//        //heThong.QLDocGia.TimTheoId(101)?.HienThiChiTiet();

//        //Console.WriteLine("\n--- Chi tiết Sách ID 1 ---");
//        //heThong.QLSach.TimTheoId(1)?.HienThiChiTiet();

//        // 3. Thử mượn sách đã mượn
//        heThong.ChoMuonSach(102, 1); // Thử mượn lại sách 'Tôi Thấy Hoa Vàng...'

//        Console.ReadKey();
//    }
//}
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)

//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)
///
//// Tổng số dòng code: ~300 dòng (dễ dàng mở rộng)