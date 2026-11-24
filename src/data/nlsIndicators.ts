import type { GradeLevel, NlsIndicator } from '../types/khbd';

const DOMAIN_NAMES: Record<string, string> = {
  '1': 'Khai thác dữ liệu và thông tin',
  '2': 'Giao tiếp và hợp tác',
  '3': 'Sáng tạo nội dung số',
  '4': 'An toàn',
  '5': 'Giải quyết vấn đề',
  '6': 'Ứng dụng trí tuệ nhân tạo',
};

type RawNlsRow = [gradeGroup: '6-7' | '8-9', code: string, detail: string];

/**
 * Bảng chỉ báo Năng lực số dành cho khối THCS (Lớp 6–7: TC1 • Lớp 8–9: TC2)
 * Trích xuất nguyên văn từ tệp Bang_chi_bao_NLS_THCS_71692fa1.pdf
 */
const RAW_NLS_ROWS: RawNlsRow[] = [
  // Trang 1
  ['6-7', '1.1.TC1a', 'Duyệt, tìm kiếm và lọc dữ liệu, thông tin và nội dung số. Giải thích được nhu cầu thông tin.'],
  ['6-7', '1.1.TC1b', 'Duyệt, tìm kiếm và lọc dữ liệu, thông tin và nội dung số. Thực hiện được rõ ràng và theo quy trình các tìm kiếm để tìm dữ liệu, thông tin và nội dung trong môi trường số.'],
  ['6-7', '1.1.TC1c', 'Duyệt, tìm kiếm và lọc dữ liệu, thông tin và nội dung số. Giải thích được cách truy cập và điều hướng các kết quả tìm kiếm.'],
  ['6-7', '1.1.TC1d', 'Duyệt, tìm kiếm và lọc dữ liệu, thông tin và nội dung số. Giải thích được rõ ràng và theo quy trình chiến lược tìm kiếm.'],
  ['8-9', '1.1.TC2a', 'Duyệt, tìm kiếm và lọc dữ liệu, thông tin và nội dung số. Minh họa được nhu cầu thông tin.'],
  ['8-9', '1.1.TC2b', 'Duyệt, tìm kiếm và lọc dữ liệu, thông tin và nội dung số. Tổ chức được tìm kiếm dữ liệu, thông tin và nội dung trong môi trường số.'],
  ['8-9', '1.1.TC2c', 'Duyệt, tìm kiếm và lọc dữ liệu, thông tin và nội dung số. Mô tả được cách truy cập những dữ liệu, thông tin và nội dung này cũng như điều hướng giữa chúng.'],
  ['8-9', '1.1.TC2d', 'Duyệt, tìm kiếm và lọc dữ liệu, thông tin và nội dung số. Tổ chức được các chiến lược tìm kiếm.'],
  ['6-7', '1.2.TC1a', 'Đánh giá dữ liệu, thông tin và nội dung số. Thực hiện phân tích, so sánh, đánh giá được độ tin cậy và độ chính xác của các nguồn dữ liệu, thông tin và nội dung số đã được tổ chức rõ ràng.'],
  ['6-7', '1.2.TC1b', 'Đánh giá dữ liệu, thông tin và nội dung số. Thực hiện phân tích, diễn giải và đánh giá được dữ liệu, thông tin và nội dung số được xác định rõ ràng.'],
  ['8-9', '1.2.TC2a', 'Đánh giá dữ liệu, thông tin và nội dung số. Thực hiện phân tích, so sánh và đánh giá được các nguồn dữ liệu, thông tin và nội dung số.'],
  ['8-9', '1.2.TC2b', 'Đánh giá dữ liệu, thông tin và nội dung số. Thực hiện phân tích, diễn giải và đánh giá được dữ liệu, thông tin và nội dung số.'],
  ['6-7', '1.3.TC1a', 'Quản lý dữ liệu, thông tin và nội dung số. Lựa chọn được dữ liệu, thông tin và nội dung để tổ chức, lưu trữ và truy xuất chúng một cách thường xuyên trong môi trường số.'],
  ['6-7', '1.3.TC1b', 'Quản lý dữ liệu, thông tin và nội dung số. Sắp xếp chúng một cách trật tự trong một môi trường có cấu trúc.'],

  // Trang 2
  ['8-9', '1.3.TC2a', 'Quản lý dữ liệu, thông tin và nội dung số. Sắp xếp được thông tin, dữ liệu, nội dung để dễ dàng lưu trữ và truy xuất.'],
  ['8-9', '1.3.TC2b', 'Quản lý dữ liệu, thông tin và nội dung số. Tổ chức được thông tin, dữ liệu và nội dung trong một môi trường có cấu trúc.'],
  ['6-7', '2.1.TC1a', 'Tương tác thông qua công nghệ số. Thực hiện được các tương tác được xác định rõ ràng và thường xuyên với các công nghệ số.'],
  ['6-7', '2.1.TC1b', 'Tương tác thông qua công nghệ số. Lựa chọn được các phương tiện giao tiếp số phù hợp, được xác định rõ ràng cho phù hợp với bối cảnh nhất định.'],
  ['8-9', '2.1.TC2a', 'Tương tác thông qua công nghệ số. Lựa chọn được nhiều công nghệ số để tương tác.'],
  ['8-9', '2.1.TC2b', 'Tương tác thông qua công nghệ số. Lựa chọn được nhiều phương tiện truyền thông số cho phù hợp với bối cảnh nhất định.'],
  ['6-7', '2.2.TC1a', 'Chia sẻ thông tin và nội dung thông qua công nghệ số. Lựa chọn các công nghệ số phù hợp được xác định rõ để trao đổi dữ liệu, thông tin và nội dung số.'],
  ['6-7', '2.2.TC1b', 'Chia sẻ thông tin và nội dung thông qua công nghệ số. Giải thích cách thức hoạt động như một trung gian để chia sẻ thông tin và nội dung thông qua các công nghệ kỹ thuật số được xác định rõ ràng và thường xuyên.'],
  ['6-7', '2.2.TC1c', 'Chia sẻ thông tin và nội dung thông qua công nghệ số. Minh họa rõ ràng và thường xuyên các phương pháp tham chiếu và ghi chú nguồn.'],
  ['8-9', '2.2.TC2a', 'Chia sẻ thông tin và nội dung thông qua công nghệ số. Vận dụng được các công nghệ số phù hợp để chia sẻ dữ liệu, thông tin và nội dung số.'],
  ['8-9', '2.2.TC2b', 'Chia sẻ thông tin và nội dung thông qua công nghệ số. Giải thích được cách đóng vai trò trung gian để chia sẻ thông tin và nội dung thông qua công nghệ số.'],
  ['8-9', '2.2.TC2c', 'Chia sẻ thông tin và nội dung thông qua công nghệ số. Áp dụng được các phương pháp tham chiếu và ghi chú nguồn.'],
  ['6-7', '2.3.TC1a', 'Sử dụng công nghệ số để thực hiện trách nhiệm công dân. Lựa chọn được các dịch vụ số được xác định rõ ràng và phổ biến để tham gia vào xã hội.'],
  ['6-7', '2.3.TC1b', 'Sử dụng công nghệ số để thực hiện trách nhiệm công dân. Xác định được các công nghệ số rõ ràng và thích hợp để tự mình trang bị và tham gia vào xã hội như một công dân.'],
  ['8-9', '2.3.TC2a', 'Sử dụng công nghệ số để thực hiện trách nhiệm công dân. Lựa chọn được các dịch vụ số để tham gia vào xã hội.'],

  // Trang 3
  ['8-9', '2.3.TC2b', 'Sử dụng công nghệ số để thực hiện trách nhiệm công dân. Thảo luận về các công nghệ số phù hợp để nâng cao năng lực của bản thân và tham gia vào xã hội với tư cách là một công dân.'],
  ['6-7', '2.4.TC1a', 'Hợp tác thông qua công nghệ số. Lựa chọn được các công cụ và công nghệ số được xác định rõ ràng và thường xuyên cho các quá trình hợp tác.'],
  ['8-9', '2.4.TC2a', 'Hợp tác thông qua công nghệ số. Lựa chọn được các công cụ và công nghệ số cho các quá trình hợp tác.'],
  ['6-7', '2.5.TC1a', 'Quy tắc ứng xử trên mạng. Làm rõ được các chuẩn mực hành vi thường xuyên và được xác định rõ ràng cũng như bí quyết khi sử dụng công nghệ số và tương tác trong môi trường số.'],
  ['6-7', '2.5.TC1b', 'Quy tắc ứng xử trên mạng. Thể hiện được các chiến lược giao tiếp thường xuyên và xác định rõ ràng phương thức giao tiếp phù hợp trong môi trường số.'],
  ['6-7', '2.5.TC1c', 'Quy tắc ứng xử trên mạng. Mô tả các khía cạnh đa dạng về văn hóa và thế hệ được xác định rõ ràng và thông thường cần xem xét trong môi trường số.'],
  ['8-9', '2.5.TC2a', 'Quy tắc ứng xử trên mạng. Thảo luận về các chuẩn mực hành vi và cách sử dụng công nghệ số và tương tác trong môi trường số.'],
  ['8-9', '2.5.TC2b', 'Quy tắc ứng xử trên mạng. Thảo luận các chiến lược giao tiếp phù hợp trong môi trường số.'],
  ['8-9', '2.5.TC2c', 'Quy tắc ứng xử trên mạng. Thảo luận các khía cạnh đa dạng về văn hóa và thế hệ cần xem xét trong môi trường số.'],
  ['6-7', '2.6.TC1a', 'Quản lý danh tính số. Phân biệt được một loạt các danh tính số thông thường và được xác định rõ ràng.'],
  ['6-7', '2.6.TC1b', 'Quản lý danh tính số. Giải thích được những cách được xác định rõ ràng và thường xuyên để bảo vệ danh tiếng trực tuyến của bản thân.'],
  ['6-7', '2.6.TC1c', 'Quản lý danh tính số. Mô tả dữ liệu được xác định rõ ràng mà bạn thường xuyên thu được thông qua các công cụ, môi trường hoặc dịch vụ số.'],
  ['8-9', '2.6.TC2a', 'Quản lý danh tính số. Hiển thị được nhiều danh tính số cụ thể.'],
  ['8-9', '2.6.TC2b', 'Quản lý danh tính số. Thảo luận những cách cụ thể để bảo vệ danh tiếng trực tuyến của bản thân.'],
  ['8-9', '2.6.TC2c', 'Quản lý danh tính số. Thao tác dữ liệu cá nhân tạo ra thông qua các công cụ, môi trường hoặc dịch vụ số.'],

  // Trang 4
  ['6-7', '3.1.TC1a', 'Phát triển nội dung số. Chỉ ra được cách tạo và chỉnh sửa nội dung có khái niệm cụ thể và mang tính phổ thông bằng những định dạng rõ ràng, phổ biến.'],
  ['6-7', '3.1.TC1b', 'Phát triển nội dung số. Thể hiện được bản thân thông qua việc tạo ra các nội dung số thông thường và được xác định rõ ràng.'],
  ['8-9', '3.1.TC2a', 'Phát triển nội dung số. Chỉ ra được cách tạo và chỉnh sửa nội dung ở các định dạng khác nhau.'],
  ['8-9', '3.1.TC2b', 'Phát triển nội dung số. Thể hiện được bản thân thông qua việc tạo ra các nội dung số.'],
  ['6-7', '3.2.TC1a', 'Tích hợp và tạo lập lại nội dung số. Giải thích được các cách sửa đổi, tinh chỉnh, cải thiện và tích hợp các mục nội dung và thông tin mới được xác định rõ ràng để tạo ra những nội dung và thông tin mới và độc đáo.'],
  ['8-9', '3.2.TC2a', 'Tích hợp và tạo lập lại nội dung số. Thảo luận các cách sửa đổi, tinh chỉnh, cải thiện và tích hợp nội dung và thông tin mới để tạo ra những nội dung và thông tin mới và độc đáo.'],
  ['6-7', '3.3.TC1a', 'Thực thi bản quyền và giấy phép. Chỉ ra được các quy tắc thông thường và được xác định rõ ràng về bản quyền và giấy phép áp dụng cho dữ liệu, thông tin và nội dung số.'],
  ['8-9', '3.3.TC2a', 'Thực thi bản quyền và giấy phép. Thảo luận các quy tắc về bản quyền và giấy phép áp dụng cho thông tin và nội dung số.'],
  ['6-7', '3.4.TC1a', 'Lập trình. Liệt kê được các hướng dẫn thông thường và được xác định rõ ràng cho một hệ thống máy tính để giải quyết các vấn đề thường ngày hoặc thực hiện các tác vụ thường ngày.'],
  ['8-9', '3.4.TC2a', 'Lập trình. Liệt kê được các hướng dẫn cho một hệ thống máy tính để giải quyết một vấn đề nhất định hoặc thực hiện một nhiệm vụ cụ thể.'],
  ['6-7', '4.1.TC1a', 'Bảo vệ thiết bị. Chỉ ra được những cách thức cơ bản và phổ biến để bảo vệ thiết bị và nội dung số.'],
  ['6-7', '4.1.TC1b', 'Bảo vệ thiết bị. Phân biệt được những rủi ro và mối đe dọa cơ bản và phổ biến trong môi trường số.'],
  ['6-7', '4.1.TC1c', 'Bảo vệ thiết bị. Chọn lựa được các biện pháp an toàn và bảo mật rõ ràng và thường xuyên.'],
  ['6-7', '4.1.TC1d', 'Bảo vệ thiết bị. Chỉ ra được những cách thức cơ bản và phổ biến để quan tâm đến mức độ tin cậy và quyền riêng tư.'],
  ['8-9', '4.1.TC2a', 'Bảo vệ thiết bị. Thiết lập được những cách thức bảo vệ thiết bị và nội dung số.'],
  ['8-9', '4.1.TC2b', 'Bảo vệ thiết bị. Phân biệt được rủi ro và mối đe dọa trong môi trường số.'],

  // Trang 5
  ['8-9', '4.1.TC2c', 'Bảo vệ thiết bị. Chọn lựa được các biện pháp an toàn và bảo mật.'],
  ['8-9', '4.1.TC2d', 'Bảo vệ thiết bị. Giải thích được các cách thức để quan tâm đến mức độ tin cậy và quyền riêng tư.'],
  ['6-7', '4.2.TC1a', 'Bảo vệ dữ liệu cá nhân và quyền riêng tư. Giải thích được các cách thức cơ bản và phổ biến để bảo vệ dữ liệu cá nhân và quyền riêng tư trong môi trường số.'],
  ['6-7', '4.2.TC1b', 'Bảo vệ dữ liệu cá nhân và quyền riêng tư. Giải thích được các cách thức cơ bản và phổ biến để sử dụng và chia sẻ thông tin định danh cá nhân một cách an toàn.'],
  ['6-7', '4.2.TC1c', 'Bảo vệ dữ liệu cá nhân và quyền riêng tư. Chỉ ra được các tuyên bố cơ bản và phổ biến trong chính sách quyền riêng tư về cách sử dụng dữ liệu cá nhân trong các dịch vụ số.'],
  ['8-9', '4.2.TC2a', 'Bảo vệ dữ liệu cá nhân và quyền riêng tư. Thảo luận về cách bảo vệ dữ liệu cá nhân và quyền riêng tư trong môi trường số.'],
  ['8-9', '4.2.TC2b', 'Bảo vệ dữ liệu cá nhân và quyền riêng tư. Thảo luận về cách sử dụng và chia sẻ thông tin định danh cá nhân một cách an toàn.'],
  ['8-9', '4.2.TC2c', 'Bảo vệ dữ liệu cá nhân và quyền riêng tư. Chỉ ra được các tuyên bố trong chính sách quyền riêng tư về cách sử dụng dữ liệu cá nhân trong các dịch vụ số.'],
  ['6-7', '4.3.TC1a', 'Bảo vệ sức khỏe và an sinh số. Giải thích được những cách thức cơ bản và phổ biến để tránh rủi ro và đe dọa đối với sức khỏe thể chất và tinh thần khi sử dụng công nghệ số.'],
  ['6-7', '4.3.TC1b', 'Bảo vệ sức khỏe và an sinh số. Lựa chọn được những cách thức cơ bản và phổ biến để bảo vệ bản thân khỏi nguy cơ trong môi trường số.'],
  ['6-7', '4.3.TC1c', 'Bảo vệ sức khỏe và an sinh số. Chỉ ra được những công nghệ số cơ bản và phổ biến giúp tăng cường thịnh vượng xã hội và sự hòa hợp trong xã hội.'],
  ['8-9', '4.3.TC2a', 'Bảo vệ sức khỏe và an sinh số. Giải thích được những cách thức để tránh những sự đe dọa liên quan đến việc sử dụng công nghệ số đối với sức khỏe thể chất và tinh thần.'],
  ['8-9', '4.3.TC2b', 'Bảo vệ sức khỏe và an sinh số. Lựa chọn được cách thức bảo vệ bản thân và người khác khỏi nguy cơ trong môi trường số.'],
  ['8-9', '4.3.TC2c', 'Bảo vệ sức khỏe và an sinh số. Thảo luận về những công nghệ số giúp tăng cường thịnh vượng xã hội và sự hòa hợp trong xã hội.'],
  ['6-7', '4.4.TC1a', 'Bảo vệ môi trường. Chỉ ra được những tác động cơ bản và phổ biến của công nghệ số và việc sử dụng công nghệ số đối với môi trường.'],

  // Trang 6
  ['8-9', '4.4.TC2a', 'Bảo vệ môi trường. Thảo luận về các cách thức bảo vệ môi trường khỏi tác động của công nghệ số và việc sử dụng công nghệ số.'],
  ['6-7', '5.1.TC1a', 'Giải quyết các vấn đề kỹ thuật. Chỉ ra được các vấn đề kỹ thuật thông thường và được xác định rõ ràng khi vận hành thiết bị và sử dụng môi trường số.'],
  ['6-7', '5.1.TC1b', 'Giải quyết các vấn đề kỹ thuật. Chọn được các giải pháp được xác định rõ ràng và thông thường cho chúng.'],
  ['8-9', '5.1.TC2a', 'Giải quyết các vấn đề kỹ thuật. Phân biệt được các vấn đề kỹ thuật khi vận hành thiết bị và sử dụng môi trường số.'],
  ['8-9', '5.1.TC2b', 'Giải quyết các vấn đề kỹ thuật. Chọn được giải pháp cho chúng.'],
  ['6-7', '5.2.TC1a', 'Xác định nhu cầu và giải pháp công nghệ. Chỉ ra được những nhu cầu được xác định rõ ràng và thường xuyên.'],
  ['6-7', '5.2.TC1b', 'Xác định nhu cầu và giải pháp công nghệ. Chọn được các công cụ số thông thường và được xác định rõ ràng cũng như các giải pháp công nghệ có thể có để giải quyết những nhu cầu đó.'],
  ['6-7', '5.2.TC1c', 'Xác định nhu cầu và giải pháp công nghệ. Chọn được những cách thông thường và được xác định rõ ràng để điều chỉnh và tùy chỉnh môi trường số theo nhu cầu cá nhân.'],
  ['8-9', '5.2.TC2a', 'Xác định nhu cầu và giải pháp công nghệ. Giải thích nhu cầu cá nhân.'],
  ['8-9', '5.2.TC2b', 'Xác định nhu cầu và giải pháp công nghệ. Lựa chọn được các công cụ số và các giải pháp công nghệ có thể có để giải quyết những nhu cầu đó.'],
  ['8-9', '5.2.TC2c', 'Xác định nhu cầu và giải pháp công nghệ. Chọn được cách điều chỉnh và tùy chỉnh môi trường số theo nhu cầu cá nhân.'],
  ['6-7', '5.3.TC1a', 'Sử dụng sáng tạo công nghệ số. Chọn được các công cụ và công nghệ số có thể được sử dụng để tạo ra kiến thức rõ ràng cũng như các quy trình và sản phẩm đổi mới được xác định rõ ràng.'],
  ['6-7', '5.3.TC1b', 'Sử dụng sáng tạo công nghệ số. Gắn kết được cá nhân và tập thể vào một số quá trình xử lý nhận thức để hiểu và giải quyết các vấn đề mang tính khái niệm và tình huống có vấn đề thông thường và được xác định rõ ràng trong môi trường số.'],
  ['8-9', '5.3.TC2a', 'Sử dụng sáng tạo công nghệ số. Phân biệt được các công cụ và công nghệ số có thể được sử dụng để tạo ra kiến thức và đổi mới quy trình và sản phẩm.'],
  ['8-9', '5.3.TC2b', 'Sử dụng sáng tạo công nghệ số. Gắn kết được cá nhân và tập thể vào quá trình xử lý nhận thức để hiểu và giải quyết các vấn đề khái niệm và tình huống có vấn đề trong môi trường số.'],

  // Trang 7
  ['6-7', '5.4.TC1a', 'Xác định các vấn đề cần cải thiện về NLS. Giải thích được NLS của bản thân cần được cải thiện hoặc cập nhật ở đâu.'],
  ['6-7', '5.4.TC1b', 'Xác định các vấn đề cần cải thiện về NLS. Chỉ ra được nơi để tìm kiếm các cơ hội được xác định rõ ràng để phát triển bản thân và cập nhật sự phát triển công nghệ số.'],
  ['8-9', '5.4.TC2a', 'Xác định các vấn đề cần cải thiện về NLS. Thảo luận về lĩnh vực NLS của bản thân cần được cải thiện hoặc cập nhật.'],
  ['8-9', '5.4.TC2b', 'Xác định các vấn đề cần cải thiện về NLS. Chỉ ra được cách hỗ trợ người khác phát triển NLS của họ.'],
  ['8-9', '5.4.TC2c', 'Xác định các vấn đề cần cải thiện về NLS. Chỉ ra được nơi để tìm kiếm cơ hội phát triển bản thân và cập nhật sự phát triển công nghệ số.'],
  ['6-7', '6.1.TC1a', 'Hiểu biết về trí tuệ nhân tạo. Giải thích được nguyên tắc hoạt động cơ bản của AI.'],
  ['6-7', '6.1.TC1b', 'Hiểu biết về trí tuệ nhân tạo. Diễn giải được các thuật ngữ và khái niệm liên quan đến AI.'],
  ['8-9', '6.1.TC2a', 'Hiểu biết về trí tuệ nhân tạo. Áp dụng được các nguyên tắc cơ bản của AI để giải quyết vấn đề đơn giản.'],
  ['8-9', '6.1.TC2b', 'Hiểu biết về trí tuệ nhân tạo. Thực hiện được các thao tác cơ bản trên các công cụ AI.'],
  ['6-7', '6.2.TC1a', 'Sử dụng trí tuệ nhân tạo. Sử dụng được các công cụ AI trong công việc và học tập hàng ngày.'],
  ['6-7', '6.2.TC1b', 'Sử dụng trí tuệ nhân tạo. Thực hành được các kỹ năng sử dụng AI thông qua các bài tập và dự án nhỏ.'],
  ['6-7', '6.2.TC1c', 'Sử dụng trí tuệ nhân tạo. Xem xét các khía cạnh đạo đức khi sử dụng AI, bảo đảm không vi phạm quyền riêng tư và bảo mật dữ liệu.'],
  ['8-9', '6.2.TC2a', 'Sử dụng trí tuệ nhân tạo. Tối ưu hóa việc sử dụng các công cụ AI để đạt hiệu quả cao hơn.'],
  ['8-9', '6.2.TC2b', 'Sử dụng trí tuệ nhân tạo. Quản lý được việc triển khai các công cụ AI trong các dự án nhỏ.'],
  ['8-9', '6.2.TC2c', 'Sử dụng trí tuệ nhân tạo. Bảo vệ được dữ liệu cá nhân và tuân thủ các quy định pháp luật về bảo mật thông tin khi sử dụng AI.'],
  ['6-7', '6.3.TC1a', 'Đánh giá trí tuệ nhân tạo. Giải thích được cách thức hoạt động của các hệ thống AI đơn giản.'],
  ['6-7', '6.3.TC1b', 'Đánh giá trí tuệ nhân tạo. Tóm tắt được các đặc điểm và ứng dụng của hệ thống AI.'],

  // Trang 8
  ['8-9', '6.3.TC2a', 'Đánh giá trí tuệ nhân tạo. Phân tích được hiệu quả của hệ thống AI trong việc giải quyết các vấn đề cụ thể.'],
  ['8-9', '6.3.TC2b', 'Đánh giá trí tuệ nhân tạo. So sánh được hiệu suất của các hệ thống AI khác nhau.'],
];

export const NLS_INDICATORS: NlsIndicator[] = RAW_NLS_ROWS.map(([gradeGroup, code, detail]) => {
  const domainCode = code.split('.')[0];
  return {
    code,
    gradeGroup,
    gradeLabel: gradeGroup === '6-7' ? 'Lớp 6, 7' : 'Lớp 8, 9',
    level: gradeGroup === '6-7' ? 'TC1' : 'TC2',
    domainCode,
    domainName: DOMAIN_NAMES[domainCode] ?? '',
    detail,
  };
});

export const NLS_INDICATOR_MAP: Map<string, NlsIndicator> = new Map(
  NLS_INDICATORS.map((item) => [item.code.toUpperCase(), item])
);

export function getNlsIndicatorsForGrade(grade: GradeLevel): NlsIndicator[] {
  const targetGroup = grade <= 7 ? '6-7' : '8-9';
  return NLS_INDICATORS.filter((item) => item.gradeGroup === targetGroup);
}

export function findNlsIndicatorByCode(code: string): NlsIndicator | undefined {
  return NLS_INDICATOR_MAP.get(code.trim().toUpperCase());
}
