export interface NewsItem {
  id: string;
  title: string;
  date: string;
  image: string;
  badge?: string;
}

const today = new Date().toLocaleDateString('vi-VN');

export const SAMPLE_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Cách bảo vệ phổi hiệu quả trong mùa o nhiễm',
    date: today,
    badge: 'Nổi bật',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC_iLiX96-7KdxD4YhY0FSz0j7UjUIwRaf_hijFJXoGnoU0IKtsM5oAaEYSD5faycH9y8oNIauP5l9PXYxdsY8BgA76M9mLZJ8ee-3zNiE5svEEj9YwZ2w1qWdc7fqr3OPfkX5dkfXBaLvlobTs2n7EgUxU2vrO2z08OQ7LYxOz-yk62p01ISci48F58PYinPutu76l38sDmsdKyYvzADcFQ5Ir61f-_9CilNd2SDQQ-joUrGyreyvry5R-zRH__G7ns7a-0x5bTuPF',
  },
  {
    id: '2',
    title: '5 loại thực phẩm "vàng" giúp thanh lọc phổi',
    date: today,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDuT8PX4pCe44kEMMhyHmWX_Lu8fVS07PKoL9Mlcj-hpq61iUxwNd0HtAGHEpSvERiEDZx2SOGC2ux-14VEWoRQ3QTtXbX1hb_XROkDVvUjJXMCmnFCbrjerRmFIQONHmn4kVqrmJZh_3HXTwJAxAG7TZxYakAAW57D-mE4oazGNsaBRcMWZKAgsWK463Z130Kp86aTSo1SGa5mMMjzFcezqP5lQ_KuTh7i5bSDiVXI30RnFv_VOhvhjHcfENOSRCgzy7vslHqkek-e',
  },
  {
    id: '3',
    title: 'Tâm soát ung thư phổi: Khi nào cần thực hiện?',
    date: today,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD8Z35PMEKVy1oCowwCra6qNghyrapFVbSjVECe3cNKjl9gZJHbC4gWSbILWcIonzWzC2L-dgPNFoAVbfFQj8SIDoprB3jEKaqmVyP6_DkfYIAuSHJxPiThA1CjgGDL1vIkDu8l4o0VvJbY1M-7mGIRoFs5AbQiuFe9F8eVabNuGTYVUXVKT5QW0pmOXYzTKTwkDUyGpEZGa_xZ-2_an9chkmWtjg9hPXGNeXRmlFf3hHtS1ahwIv5dJKZmRNMlXphQUS7w_KvcyEMB',
  },
];
