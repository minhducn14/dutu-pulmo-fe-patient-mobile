export type NewsCategory = 'HOSPITAL' | 'MEDICAL' | 'PROMOTION' | 'SYSTEM';

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  content: string;
  date: string;
  image: string;
  category: NewsCategory;
  badge?: string;
}

const today = new Date().toLocaleDateString('vi-VN');

export const NEWS_CATEGORIES: { value: NewsCategory; label: string; color: string }[] = [
  { value: 'HOSPITAL', label: 'Tin bệnh viện', color: '#2563EB' },
  { value: 'MEDICAL', label: 'Kiến thức y khoa', color: '#16A34A' },
  { value: 'PROMOTION', label: 'Tin khuyến mãi', color: '#EA580C' },
  { value: 'SYSTEM', label: 'Cập nhật hệ thống', color: '#9333EA' },
];

export const SAMPLE_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Cách bảo vệ phổi hiệu quả trong mùa ô nhiễm',
    description: 'Ô nhiễm không khí đang trở thành vấn đề nghiêm trọng. Hãy cùng tìm hiểu các cách bảo vệ lá phổi của bạn.',
    content: `
      <p>Ô nhiễm không khí, đặc biệt là bụi mịn PM2.5, có thể gây ra nhiều vấn đề sức khỏe nghiêm trọng cho hệ hô hấp. Để bảo vệ phổi hiệu quả, bạn nên:</p>
      <ul>
        <li>Đeo khẩu trang đạt chuẩn khi ra ngoài (N95, N99).</li>
        <li>Sử dụng máy lọc không khí trong nhà.</li>
        <li>Hạn chế ra ngoài vào những giờ cao điểm ô nhiễm.</li>
        <li>Tăng cường thực phẩm giàu chất chống oxy hóa.</li>
      </ul>
      <p>Việc kiểm tra sức khỏe định kỳ cũng rất quan trọng để phát hiện sớm các vấn đề về phổi.</p>
    `,
    date: today,
    category: 'MEDICAL',
    badge: 'Nổi bật',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC_iLiX96-7KdxD4YhY0FSz0j7UjUIwRaf_hijFJXoGnoU0IKtsM5oAaEYSD5faycH9y8oNIauP5l9PXYxdsY8BgA76M9mLZJ8ee-3zNiE5svEEj9YwZ2w1qWdc7fqr3OPfkX5dkfXBaLvlobTs2n7EgUxU2vrO2z08OQ7LYxOz-yk62p01ISci48F58PYinPutu76l38sDmsdKyYvzADcFQ5Ir61f-_9CilNd2SDQQ-joUrGyreyvry5R-zRH__G7ns7a-0x5bTuPF',
  },
  {
    id: '2',
    title: '5 loại thực phẩm vàng giúp thanh lọc phổi',
    description: 'Chế độ ăn uống đóng vai trò quan trọng trong việc duy trì sức khỏe hệ hô hấp.',
    content: `
      <p>Dưới đây là 5 loại thực phẩm giúp làm sạch và bảo vệ phổi của bạn:</p>
      <ol>
        <li><strong>Gừng:</strong> Có tác dụng kháng viêm và giúp loại bỏ các chất ô nhiễm khỏi phổi.</li>
        <li><strong>Táo:</strong> Chứa flavonoid và các vitamin giúp cải thiện chức năng phổi.</li>
        <li><strong>Nghệ:</strong> Chất curcumin trong nghệ có đặc tính kháng viêm mạnh mẽ.</li>
        <li><strong>Trà xanh:</strong> Chứa nhiều chất chống oxy hóa giúp phổi hoạt động tốt hơn.</li>
        <li><strong>Rau họ cải:</strong> Súp lơ, cải xoăn giúp giảm nguy cơ mắc các bệnh về phổi.</li>
      </ol>
    `,
    date: today,
    category: 'MEDICAL',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDuT8PX4pCe44kEMMhyHmWX_Lu8fVS07PKoL9Mlcj-hpq61iUxwNd0HtAGHEpSvERiEDZx2SOGC2ux-14VEWoRQ3QTtXbX1hb_XROkDVvUjJXMCmnFCbrjerRmFIQONHmn4kVqrmJZh_3HXTwJAxAG7TZxYakAAW57D-mE4oazGNsaBRcMWZKAgsWK463Z130Kp86aTSo1SGa5mMMjzFcezqP5lQ_KuTh7i5bSDiVXI30RnFv_VOhvhjHcfENOSRCgzy7vslHqkek-e',
  },
  {
    id: '3',
    title: 'Tầm soát ung thư phổi: Khi nào cần thực hiện?',
    description: 'Phát hiện sớm ung thư phổi giúp tăng cơ hội điều trị thành công.',
    content: `
      <p>Ung thư phổi thường không có triệu chứng rõ ràng ở giai đoạn đầu. Vì vậy, việc tầm soát là vô cùng cần thiết đối với:</p>
      <ul>
        <li>Người hút thuốc lá lâu năm.</li>
        <li>Người sống hoặc làm việc trong môi trường ô nhiễm, hóa chất.</li>
        <li>Người có tiền sử gia đình mắc bệnh ung thư phổi.</li>
      </ul>
      <p>Hãy liên hệ với bác sĩ chuyên khoa tại Dutu Pulmo để được tư vấn gói tầm soát phù hợp.</p>
    `,
    date: today,
    category: 'HOSPITAL',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD8Z35PMEKVy1oCowwCra6qNghyrapFVbSjVECe3cNKjl9gZJHbC4gWSbILWcIonzWzC2L-dgPNFoAVbfFQj8SIDoprB3jEKaqmVyP6_DkfYIAuSHJxPiThA1CjgGDL1vIkDu8l4o0VvJbY1M-7mGIRoFs5AbQiuFe9F8eVabNuGTYVUXVKT5QW0pmOXYzTKTwkDUyGpEZGa_xZ-2_an9chkmWtjg9hPXGNeXRmlFf3hHtS1ahwIv5dJKZmRNMlXphQUS7w_KvcyEMB',
  },
  {
    id: '4',
    title: 'Chương trình ưu đãi tháng 3: Tặng mã giảm giá 20%',
    description: 'Dutu Pulmo dành tặng ưu đãi đặc biệt cho các gói khám tổng quát hệ hô hấp.',
    content: `
      <p>Nhằm tri ân khách hàng, Dutu Pulmo triển khai chương trình ưu đãi đặc biệt trong tháng 3:</p>
      <ul>
        <li>Giảm 20% cho tất cả các gói tầm soát phổi.</li>
        <li>Miễn phí tư vấn cùng chuyên gia cho khách hàng đặt lịch qua ứng dụng.</li>
      </ul>
      <p>Thời gian áp dụng: Từ 01/03 đến 31/03/2026. Nhập mã <strong>DUTUHEALTH</strong> khi thanh toán để hưởng ưu đãi.</p>
    `,
    date: today,
    category: 'PROMOTION',
    badge: 'Mới',
    image: 'https://images.unsplash.com/photo-1542884748-2b87b36c6b90?q=80&w=2070&auto=format&fit=crop',
  },
];
