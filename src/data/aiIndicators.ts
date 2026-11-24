import type { AiIndicator, GradeLevel } from '../types/khbd';

const AI_DOMAIN_NAMES: Record<'A' | 'B' | 'C' | 'D', string> = {
  A: 'Tư duy lấy con người làm trung tâm',
  B: 'Đạo đức AI',
  C: 'Các kĩ thuật và ứng dụng AI',
  D: 'Thiết kế hệ thống AI',
};

const AI_TOPIC_NAMES: Record<string, string> = {
  A1: 'Tính chủ động của con người',
  A2: 'AI vì sự tiến bộ của con người',
  A3: 'Công dân trong kỉ nguyên AI',
  B1: 'Các khía cạnh đạo đức của AI',
  B2: 'Sử dụng AI an toàn và có trách nhiệm',
  B3: 'Nguyên tắc đạo đức và trách nhiệm xã hội',
  C1: 'Đặc điểm chính của AI',
  C2: 'Ứng dụng AI trong học tập và cuộc sống',
  C3: 'Công nghệ AI',
  C4: 'Dữ liệu trong AI',
  C5: 'Kĩ thuật và thuật toán AI',
  D1: 'Nhận diện và hình thành giải pháp',
  D2: 'Cấu trúc và tương tác, cải tiến hệ thống',
};

type RawAiRow = [
  grade: GradeLevel,
  topicCode: string,
  contentTitle: string,
  code: string,
  detail: string
];

/**
 * Khung nội dung giáo dục Trí tuệ nhân tạo cho học sinh phổ thông — Cấp THCS (Lớp 6, 7, 8, 9)
 * Kèm theo Quyết định số 2422/QĐ-BGDĐT ngày 18/08/2026 của Bộ Giáo dục và Đào tạo
 * Bao gồm đầy đủ cả yêu cầu cần đạt Cốt lõi và Mở rộng (MR), trích xuất nguyên văn.
 */
const RAW_AI_ROWS: RawAiRow[] = [
  // ==================== LỚP 6 ====================
  [6, 'A1', 'Con người tạo và điều khiển AI', '6.A1.1', 'Giải thích được AI là sản phẩm do con người tạo ra, lập trình và điều khiển để thực hiện những nhiệm vụ cụ thể; AI không tự sinh ra và không hoạt động độc lập với con người. Nêu được ví dụ về một số công cụ AI quen thuộc trong đời sống hằng ngày và chỉ ra được vai trò của con người trong việc tạo ra chúng.'],
  [6, 'A1', 'AI hoạt động theo lập trình', '6.A1.2', 'Trình bày được vai trò của AI chỉ là công cụ hỗ trợ hoạt động của con người; con người đưa ra quyết định cuối cùng và chịu trách nhiệm khi sử dụng AI.'],
  [6, 'A1', 'AI hoạt động theo lập trình', '6.A1.3', 'Thực hiện được việc kiểm tra lại một kết quả do AI đưa ra (đối chiếu với sách giáo khoa, nguồn tin cậy khác hoặc hỏi thầy cô) trước khi sử dụng, thể hiện thói quen “con người quyết định cuối cùng”.'],
  [6, 'A3', 'Con người ra quyết định với AI', '6.A3.1', 'Nêu được ví dụ về tình huống con người ra quyết định với sự hỗ trợ của AI (ví dụ: trong y tế, AI gợi ý chẩn đoán, bác sĩ xem xét và quyết định phương án điều trị; trong giao thông, AI đề xuất lộ trình nhanh hơn, người lái xe cân nhắc trước khi lựa chọn). Thực hành ra quyết định trong một tình huống giả định có gợi ý của AI (nêu lại gợi ý của AI, cân nhắc và đưa ra lựa chọn của bản thân kèm lí do).'],
  [6, 'A3', 'Học hỏi và phát triển với AI', '6.A3.2', 'Trình bày được lợi ích của AI trong việc hỗ trợ con người học hỏi, rèn luyện kĩ năng và mở rộng hiểu biết khi được sử dụng đúng cách, có mục đích rõ ràng. Sử dụng được một công cụ AI phù hợp lứa tuổi (trực tiếp hoặc theo hướng dẫn của giáo viên) để hỗ trợ một nhiệm vụ học tập đơn giản và nói lại được điều mình đã học thêm.'],
  [6, 'A3', 'Quyền riêng tư và bảo vệ dữ liệu cá nhân trong thời đại AI', '6.A3.3', 'Giải thích được dữ liệu cá nhân (hình ảnh, giọng nói, họ tên, địa chỉ, thông tin học tập, thói quen sử dụng mạng,...) là tài sản của mỗi người; chỉ chủ sở hữu mới có quyền quyết định việc chia sẻ hoặc cho phép sử dụng dữ liệu đó.'],
  [6, 'A3', 'Quyền riêng tư và bảo vệ dữ liệu cá nhân trong thời đại AI', '6.A3.4', 'Trình bày được khái niệm quyền riêng tư ở mức đơn giản; nêu được tác hại khi dữ liệu cá nhân bị sử dụng sai mục đích và ý nghĩa của việc bảo vệ quyền riêng tư đối với sự an toàn, danh dự và tự do của con người trong môi trường số. Nhận biết được một số cách ứng phó ban đầu khi có nguy cơ mất an toàn dữ liệu cá nhân (ví dụ: dừng chia sẻ; báo cho cha mẹ, thầy cô; báo cáo trên nền tảng).'],
  [6, 'B1', 'Mặt tốt và mặt xấu', '6.B1.1', 'Chỉ ra được mặt tích cực và hạn chế của một số tính năng AI cụ thể (ví dụ: tính năng thu thập dữ liệu người dùng giúp AI đưa ra gợi ý chính xác hơn nhưng có thể ảnh hưởng đến quyền riêng tư).'],
  [6, 'B2', 'An toàn khi sử dụng AI', '6.B2.1', 'Đặt được một số câu hỏi đơn giản để kiểm tra tính an toàn và minh bạch của ứng dụng AI (ví dụ: “Công cụ này có an toàn không?”, “Công cụ này có thu thập thông tin cá nhân không?”, “Có thể tắt tính năng này không?”) và áp dụng các câu hỏi đó để nhận xét đơn giản về mức độ an toàn, phù hợp của một số công cụ AI.'],
  [6, 'C1', 'Các thành phần cơ bản trong kiến trúc AI và cách hoạt động cơ bản của AI', '6.C1.1', 'Giải thích được hai thành phần chính để huấn luyện (“dạy”) AI là dữ liệu (ví dụ: văn bản, hình ảnh) và thuật toán (phương pháp học từ dữ liệu). Mô tả được các bước hoạt động chính của một công cụ AI qua ví dụ đơn giản (ví dụ: trợ lí ảo nhận câu hỏi bằng giọng nói → chuyển giọng nói thành văn bản → xử lí để hiểu yêu cầu → tìm và đưa ra câu trả lời).'],
  [6, 'C1', 'Các thành phần cơ bản trong kiến trúc AI và cách hoạt động cơ bản của AI', '6.C1.MR1', 'Chỉ ra được mối liên hệ giữa quá trình huấn luyện và hoạt động của một công cụ AI qua ví dụ đơn giản (ví dụ: trợ lí ảo trả lời được câu hỏi nhờ đã được huấn luyện từ dữ liệu; dữ liệu huấn luyện càng phong phú, câu trả lời càng chính xác).'],
  [6, 'C1', 'Các thành phần cơ bản trong kiến trúc AI và cách hoạt động cơ bản của AI', '6.C1.MR2', 'Thực hiện được thử nghiệm đơn giản với một công cụ AI và nhận xét được các bước hoạt động của công cụ đó (ví dụ: đặt cùng một câu hỏi cho trợ lí ảo theo các cách nói khác nhau và quan sát kết quả).'],
  [6, 'C1', 'Tác động tích cực và tiêu cực của AI', '6.C1.2', 'Nêu được ví dụ về tác động tích cực và tác động tiêu cực của AI đối với cuộc sống của bản thân, gia đình.'],
  [6, 'C1', 'Tác động tích cực và tiêu cực của AI', '6.C1.MR3', 'Phân tích được ở mức đơn giản tác động của một công cụ AI cụ thể đối với bản thân và gia đình, trong đó chỉ ra cả mặt tích cực và mặt tiêu cực (ví dụ: tính năng gợi ý video giúp tìm được nội dung phù hợp nhưng dễ lôi cuốn người xem, gây mất nhiều thời gian).'],
  [6, 'C2', 'Làm quen với ứng dụng AI', '6.C2.1', 'Phân biệt được công cụ, tính năng có ứng dụng AI và không ứng dụng AI qua các ví dụ gần gũi trong cuộc sống (ví dụ: trợ lí ảo có ứng dụng AI; máy tính bỏ túi không ứng dụng AI).'],
  [6, 'C2', 'Làm quen với ứng dụng AI', '6.C2.2', 'Kể được tên và mô tả được chức năng chính của một số công cụ AI thông dụng (như trợ lí ảo; ứng dụng bản đồ; công cụ dịch thuật;…).'],
  [6, 'C2', 'Làm quen với ứng dụng AI', '6.C2.MR1', 'Nêu được ví dụ về ứng dụng AI trong cuộc sống, ưu tiên các vấn đề gắn với thực tiễn ở Việt Nam (ví dụ: AI trong nông nghiệp, giáo dục, dự báo lũ, dịch ngôn ngữ các dân tộc,...).'],
  [6, 'C3', 'Một số công nghệ AI quen thuộc và đơn giản', '6.C3.1', 'Kể được tên một số công nghệ AI quen thuộc trong đời sống (ví dụ: nhận dạng hình ảnh, chuyển đổi giữa văn bản và giọng nói,...).'],
  [6, 'C3', 'Một số công nghệ AI quen thuộc và đơn giản', '6.C3.MR1', 'Trình bày được một số tính năng AI tích hợp trong các ứng dụng thường gặp (ví dụ: gợi ý đề xuất nội dung trên mạng xã hội, quảng cáo cá nhân hoá,...) và nêu được ảnh hưởng của các tính năng đó đến việc sử dụng và ra quyết định của người dùng.'],
  [6, 'D1', 'Lựa chọn sử dụng AI phù hợp', '6.D1.1', 'Nêu được một số tình huống quen thuộc nên hoặc không nên sử dụng AI (ví dụ: nên dùng AI để luyện phát âm ngoại ngữ, tìm đường đi; không nên nhờ AI viết hộ bài văn, làm hộ bài tập vì làm giảm cơ hội tự rèn luyện, làm giảm khả năng tự suy nghĩ của bản thân; không nên dùng AI khi có cách giải quyết khác đơn giản và an toàn hơn).'],
  [6, 'D1', 'Lựa chọn sử dụng AI phù hợp', '6.D1.MR1', 'Trình bày được ý kiến cá nhân về việc nên hay không nên sử dụng AI trong một số tình huống thực tế; giải thích được lí do lựa chọn dựa trên lợi ích và tác hại của việc sử dụng AI trong tình huống đó.'],
  [6, 'D2', 'Giới hạn của AI so với con người', '6.D2.1', 'Trình bày được một số giới hạn của hệ thống AI so với con người qua các tình huống, công việc mà con người thực hiện phù hợp hơn (chẳng hạn như các công việc cần sự thấu hiểu cảm xúc, sáng tạo, ra quyết định trong tình huống phức tạp).'],
  [6, 'D2', 'Giới hạn của AI so với con người', '6.D2.MR1', 'Giải thích được vì sao AI gặp giới hạn trong một số công việc so với con người (ví dụ: AI học từ dữ liệu có sẵn nên khó xử lí tốt các tình huống mới, chưa từng có trong dữ liệu; AI không có cảm xúc thật nên khó thấu hiểu con người).'],
  [6, 'D2', 'Giới hạn của AI so với con người', '6.D2.MR2', 'Đề xuất được cách kết hợp giữa con người và AI trong một công việc cụ thể để phát huy thế mạnh của mỗi bên (ví dụ: AI gợi ý ý tưởng, con người lựa chọn và hoàn thiện).'],

  // ==================== LỚP 7 ====================
  [7, 'A1', 'Quyền ra quyết định', '7.A1.1', 'Giải thích được lí do con người cần giữ quyền ra quyết định khi sử dụng AI (ví dụ như bảo đảm công bằng: con người có thể xem xét hoàn cảnh và cảm xúc mà AI không hiểu được; bảo đảm an toàn: con người có thể ngăn chặn các hành động sai lệch hoặc nguy hiểm do AI gây ra; bảo vệ quyền lợi con người: không để AI xâm phạm quyền riêng tư, tự do hoặc phẩm giá cá nhân).'],
  [7, 'A1', 'Xác thực kết quả', '7.A1.2', 'Nêu được ví dụ hậu quả có thể xảy ra khi không có sự xác thực của con người về độ chính xác của kết quả do AI đưa ra trong một số trường hợp thực tế.'],
  [7, 'A1', 'Xác thực kết quả', '7.A1.MR1', 'Thực hiện được việc kiểm chứng một thông tin do AI cung cấp bằng ít nhất một nguồn đáng tin cậy khác (sách giáo khoa, trang thông tin chính thống, ý kiến thầy cô) trước khi sử dụng.'],
  [7, 'A2', 'Hậu quả khi AI quyết định', '7.A2.1', 'Phân tích được các tác hại có thể xảy ra nếu con người cho phép AI đưa ra quyết định cuối cùng trong một số tình huống thực tế.'],
  [7, 'A2', 'Ngăn chặn công cụ AI có hại', '7.A2.2', 'Nêu được các hậu quả có thể xảy ra nếu không có các quy định pháp lý nhằm ngăn chặn việc thiết kế và sản xuất các công cụ AI có hại trong một số tình huống thực tế.'],
  [7, 'A3', 'Quyền tự chủ của con người và AI', '7.A3.1', 'Nêu được ví dụ về tình huống AI được phép tự động thực hiện một số thao tác thay con người (ví dụ: tự động kiểm tra và sửa lỗi chính tả khi soạn thảo văn bản) và tình huống con người cần trực tiếp quyết định.'],
  [7, 'A3', 'Quyền tự chủ của con người và AI', '7.A3.MR1', 'Trình bày được ví dụ về xung đột giữa quyền tự chủ của con người và mức độ tự chủ của AI.'],
  [7, 'A3', 'Quyền tự chủ của con người và AI', '7.A3.MR2', 'Nêu được yêu cầu đánh giá mức độ tự chủ của AI dựa trên nhu cầu và yếu tố bối cảnh cụ thể.'],
  [7, 'A3', 'Bảo vệ quyền tự chủ của con người', '7.A3.2', 'Giải thích được sự cần thiết phải bảo vệ quyền tự chủ của con người khi sử dụng AI để đưa ra các quyết định quan trọng.'],
  [7, 'B2', 'Đánh giá và hành động vì môi trường AI an toàn, có đạo đức', '7.B2.1', 'Nêu được một số tiêu chí đơn giản (dựa trên các nguyên tắc đạo đức) để đánh giá mức độ phù hợp, an toàn của một ứng dụng AI.'],
  [7, 'B2', 'Đánh giá và hành động vì môi trường AI an toàn, có đạo đức', '7.B2.2', 'Nêu được ví dụ về các hành động cụ thể góp phần xây dựng môi trường AI có đạo đức (ví dụ: báo cáo lỗi, không sử dụng ứng dụng độc hại, yêu cầu sự minh bạch).'],
  [7, 'B3', 'Trách nhiệm khi sử dụng AI', '7.B3.1', 'Thể hiện được thái độ và cam kết cá nhân trong việc sử dụng AI có trách nhiệm thông qua một số hình thức đơn giản (ví dụ: bài viết ngắn, hùng biện hoặc sản phẩm học tập cụ thể). Thể hiện được việc khai báo trung thực khi có sử dụng AI trong sản phẩm học tập.'],
  [7, 'C4', 'Các khía cạnh đạo đức liên quan đến dữ liệu huấn luyện AI', '7.C4.1', 'Trình bày được các vấn đề đạo đức có thể nảy sinh từ dữ liệu huấn luyện AI (ví dụ: dữ liệu thiếu đa dạng dẫn đến phân biệt đối xử, dữ liệu riêng tư bị xâm phạm).'],
  [7, 'C4', 'Các khía cạnh đạo đức liên quan đến dữ liệu huấn luyện AI', '7.C4.MR1', 'Phân tích được tầm quan trọng của việc sử dụng bộ dữ liệu “sạch” và “công bằng” trong việc tạo ra các công cụ AI có đạo đức.'],
  [7, 'C5', 'Tìm hiểu một số cách học của AI', '7.C5.1', 'Mô tả được các bước chính trong quá trình huấn luyện AI qua một ví dụ cụ thể (như thu thập và gán nhãn dữ liệu ảnh chó, mèo; cho máy học từ dữ liệu; kiểm tra khả năng phân biệt trên ảnh mới; điều chỉnh nếu kết quả chưa tốt).'],
  [7, 'C5', 'Tìm hiểu một số cách học của AI', '7.C5.2', 'Nêu được ví dụ về một số cách học khác nhau của AI ở mức độ đơn giản (ví dụ: học từ dữ liệu đã được con người phân loại, gán nhãn sẵn; tự tìm ra quy luật từ dữ liệu; học qua thử nghiệm và rút kinh nghiệm từ kết quả).'],
  [7, 'C5', 'Tìm hiểu một số cách học của AI', '7.C5.MR1', 'Phân biệt được ba phương pháp học máy cơ bản (học có giám sát, học không giám sát, học tăng cường); nêu được một số ứng dụng AI sử dụng các phương pháp học máy đó.'],
  [7, 'D1', 'Ý tưởng dự án AI từ thực tiễn', '7.D1.1', 'Nêu được ví dụ về một vấn đề trong trường học hoặc cộng đồng có thể được giải quyết hoặc cải thiện bằng AI; mô tả được phạm vi của vấn đề đó (ví dụ: trong trường học có thể xây dựng chatbot giải đáp thắc mắc thường gặp về nội quy, lịch học cho học sinh; trong cộng đồng có thể dùng AI nhận dạng hình ảnh hỗ trợ phân loại rác tái chế).'],
  [7, 'D1', 'Ý tưởng dự án AI từ thực tiễn', '7.D1.MR1', 'Phân tích được tính khả thi của một ý tưởng dự án AI bằng cách trả lời các câu hỏi (ví dụ: dữ liệu có dễ thu thập không, có rủi ro đạo đức hay không, mức độ phức tạp và chi phí có phù hợp hay không).'],
  [7, 'D2', 'Dự án tạo sản phẩm từ AI', '7.D2.1', 'Lập được kế hoạch cho một dự án sáng tạo có sử dụng AI theo nhóm nhỏ.'],
  [7, 'D2', 'Dự án tạo sản phẩm từ AI', '7.D2.MR1', 'Thực hành tạo được sản phẩm đơn giản theo kế hoạch đã xây dựng.'],

  // ==================== LỚP 8 ====================
  [8, 'A1', 'AI không thay thế con người', '8.A1.1', 'Nêu được một số lĩnh vực mà AI không nên thay thế con người (ví dụ: trong giáo dục, giáo viên hiểu tâm lí học sinh, biết khích lệ, hướng dẫn và dạy đạo đức; trong y tế, bác sĩ không chỉ chữa bệnh mà còn động viên, lắng nghe bệnh nhân; trong nghệ thuật, nghệ sĩ thể hiện cảm xúc và trải nghiệm riêng mà AI không có được;...).'],
  [8, 'A1', 'Rủi ro khi lạm dụng AI', '8.A1.2', 'Nêu được những rủi ro của việc lạm dụng các công cụ AI tạo sinh, liên hệ với nguy cơ suy giảm tư duy phản biện, kĩ năng sáng tạo, sử dụng thông tin sai lệch; từ đó nêu được sự cần thiết của việc kiểm chứng nguồn thông tin khi sử dụng AI tạo sinh trong học tập.'],
  [8, 'A2', 'Nguy cơ bị hệ thống AI theo dõi, thao túng', '8.A2.1', 'Giải thích được việc một số hệ thống, dịch vụ sử dụng AI có thể thu thập, phân tích và sử dụng dữ liệu cá nhân của người dùng (vị trí, thói quen, hình ảnh, giọng nói, sở thích,...) để kiểm soát hành vi, gây ảnh hưởng hoặc thao túng quyết định của con người.'],
  [8, 'A2', 'Nguy cơ bị hệ thống AI theo dõi, thao túng', '8.A2.2', 'Nhận biết được hiện tượng sử dụng AI để kiểm soát người dùng (ví dụ: việc sử dụng AI không minh bạch hoặc sai mục đích, khiến người dùng bị theo dõi mà không biết; bị đề xuất thông tin, quảng cáo hoặc nội dung một chiều; bị thao túng suy nghĩ hoặc hành động; bị mất quyền kiểm soát dữ liệu cá nhân).'],
  [8, 'A3', 'Người dùng và người tạo AI', '8.A3.1', 'Phân biệt được vai trò của người dùng và người phát triển khi tương tác với AI.'],
  [8, 'A3', 'Người dùng và người tạo AI', '8.A3.MR1', 'Giải thích được việc người dùng cũng góp phần tác động đến công cụ AI trong quá trình sử dụng (ví dụ: dữ liệu và phản hồi của người dùng được thu thập để tiếp tục huấn luyện, cải thiện hệ thống; nội dung người dùng tương tác nhiều sẽ được AI ưu tiên đề xuất).'],
  [8, 'A3', 'Trách nhiệm pháp lý', '8.A3.2', 'Nêu được ví dụ về các bên (người sáng tạo, nhà cung cấp, người sử dụng) phải chịu trách nhiệm pháp lý đối với hậu quả do công cụ AI gây ra trong một số tình huống cụ thể (ví dụ: người dùng AI tạo hình ảnh giả mạo người khác; nhà cung cấp chatbot lan truyền thông tin sai lệch).'],
  [8, 'A3', 'Trách nhiệm giải trình', '8.A3.3', 'Nêu được những việc thể hiện trách nhiệm giải trình khi sử dụng AI trong học tập và tạo sản phẩm (ví dụ: cho biết sản phẩm có sử dụng AI và sử dụng ở phần nào; nói rõ công cụ AI đã dùng khi được hỏi; chịu trách nhiệm kiểm tra tính chính xác của nội dung do AI tạo ra trước khi sử dụng).'],
  [8, 'A3', 'Trách nhiệm giải trình', '8.A3.MR2', 'Nêu được những việc thể hiện trách nhiệm giải trình khi tạo ra hoặc thiết kế AI (ví dụ: cho biết sản phẩm sử dụng dữ liệu gì, giải thích cách sản phẩm hoạt động, nhận trách nhiệm về kết quả sản phẩm tạo ra).'],
  [8, 'B1', 'Rủi ro với AI', '8.B1.1', 'Nhận diện và phân loại được một số rủi ro phổ biến khi sử dụng AI: rủi ro về dữ liệu và quyền riêng tư; rủi ro do thuật toán thiên vị hoặc đưa ra kết luận sai; rủi ro bị lừa đảo bằng nội dung giả mạo do AI tạo ra (hình ảnh, giọng nói, tin nhắn giả).'],
  [8, 'B2', 'Phòng tránh rủi ro dữ liệu', '8.B2.1', 'Trình bày được một số việc làm, cách thức đơn giản để bảo vệ dữ liệu cá nhân, tôn trọng bản quyền và phòng tránh, giảm thiểu rủi ro khi sử dụng, phát triển AI trong các dự án học tập.'],
  [8, 'B3', 'Trách nhiệm phát triển AI', '8.B3.1', 'Nêu được các vấn đề đạo đức cần lưu ý khi phát triển AI (ví dụ: bảo mật thông tin, không cung cấp thông tin sai lệch, không xúc phạm người khác).'],
  [8, 'C1', 'Cách AI thực hiện một số chức năng cơ bản', '8.C1.1', 'Mô tả được ở mức đơn giản cách AI thực hiện một số chức năng cơ bản như “đọc”, “nghe”, “nhìn” (ví dụ: để “nghe”, AI thu âm thanh, chuyển giọng nói thành văn bản rồi phân tích để hiểu nội dung; để “nhìn”, AI phân tích các đặc điểm trong hình ảnh và so sánh với dữ liệu đã học).'],
  [8, 'C1', 'Cách AI thực hiện một số chức năng cơ bản', '8.C1.MR1', 'Phân tích được một số công nghệ, kĩ thuật đảm nhiệm các chức năng “đọc”, “nghe”, “nhìn” của AI (ví dụ: xử lí ngôn ngữ tự nhiên, nhận dạng giọng nói, thị giác máy tính).'],
  [8, 'C5', 'Cách AI nhận diện cảm xúc', '8.C5.1', 'Nêu được cách AI nhận diện cảm xúc dựa vào các đặc điểm (ví dụ: nét mặt; từ khoá trong văn bản và lời nói; ngữ điệu của lời nói; cử chỉ như gật đầu, lắc đầu,...).'],
  [8, 'C5', 'Cách AI nhận diện cảm xúc', '8.C5.MR1', 'Nhận xét được ở mức đơn giản về độ tin cậy và giới hạn của việc AI nhận diện cảm xúc (ví dụ: cùng một nét mặt có thể biểu thị những cảm xúc khác nhau tùy theo bối cảnh).'],
  [8, 'D1', 'Kế hoạch dự án AI', '8.D1.1', 'Xác định được một số vấn đề thực tế có thể giải quyết bằng AI.'],
  [8, 'D1', 'Kế hoạch dự án AI', '8.D1.MR1', 'Lập được kế hoạch sơ bộ cho dự án AI để giải quyết vấn đề đã xác định.'],
  [8, 'D2', 'Dự án AI đơn giản của em', '8.D2.1', 'Trình bày được ví dụ về một kịch bản hội thoại cho một tình huống cụ thể có ứng dụng AI (ví dụ: chatbot, trợ lí ảo).'],
  [8, 'D2', 'Dự án AI đơn giản của em', '8.D2.MR1', 'Mô tả được một số đặc điểm cơ bản của một trải nghiệm người dùng (UX) tốt khi tương tác với AI.'],
  [8, 'D2', 'Dự án AI đơn giản của em', '8.D2.MR2', 'Lập kế hoạch và triển khai được hoạt động làm việc nhóm để phát triển một sản phẩm AI đơn giản (ví dụ: chatbot, mô hình nhận dạng) bằng các công cụ có sẵn.'],

  // ==================== LỚP 9 ====================
  [9, 'A1', 'Thách thức xã hội trong kỉ nguyên AI', '9.A1.1', 'Trình bày được ý kiến cá nhân về một thách thức mà xã hội đang đối mặt trong kỉ nguyên AI (ví dụ: hi sinh sự an toàn của người dùng để ưu tiên đổi mới và phát triển AI).'],
  [9, 'A2', 'AI tác động đến xã hội', '9.A2.1', 'Nêu được dẫn chứng để giải thích vì sao AI có tác động lớn đến xã hội.'],
  [9, 'A2', 'Thiên vị và thành kiến trong AI', '9.A2.2', 'Giải thích được các vấn đề “thiên vị”, “thành kiến” mà AI có thể gây ra đối với xã hội.'],
  [9, 'A3', 'Định hướng học tập trong kỉ nguyên AI', '9.A3.1', 'Trình bày được những năng lực con người cần rèn luyện trong thế giới có AI, như biết học cách học (rèn luyện khả năng tự học, học suốt đời), phát triển tư duy phản biện (biết phân tích, đánh giá thông tin do AI cung cấp), giữ vững tính sáng tạo và cảm xúc con người (làm những việc AI không thể làm); nâng cao kĩ năng hợp tác và giao tiếp (làm việc hiệu quả với con người và AI).'],
  [9, 'A3', 'Định hướng học tập trong kỉ nguyên AI', '9.A3.2', 'Xác định được mục tiêu học tập cá nhân trong thế giới có AI (ví dụ: học cách sử dụng AI để tìm kiếm và tóm tắt thông tin; sử dụng AI để rèn luyện kĩ năng viết, đọc, vẽ, tư duy logic; luyện tập giao tiếp hoặc học ngôn ngữ mới với công cụ AI; tự đặt mục tiêu phát triển kĩ năng mềm mà AI không thay thế được).'],
  [9, 'A3', 'AI giúp thể hiện bản thân', '9.A3.3', 'Nêu được ví dụ cách sử dụng AI như một công cụ giúp thể hiện bản thân và theo đuổi đam mê.'],
  [9, 'A3', 'Nghề nghiệp tương lai', '9.A3.4', 'Trình bày được ví dụ một số thay đổi mà AI có thể mang lại cho các ngành nghề trong tương lai, từ đó nêu được một số kĩ năng gắn với các ngành nghề cụ thể cần trang bị để làm việc hiệu quả cùng AI.'],
  [9, 'B2', 'Trách nhiệm khi sử dụng AI', '9.B2.1', 'Trình bày được vai trò của người dùng trong việc kiểm soát và chịu trách nhiệm đối với kết quả cuối cùng do AI tạo ra. Khai báo được việc sử dụng AI trong sản phẩm học tập của bản thân.'],
  [9, 'B2', 'Trách nhiệm khi sử dụng AI', '9.B2.2', 'Nêu được vai trò của cá nhân và cộng đồng trong việc giám sát, phản hồi và đề xuất giải pháp để sử dụng AI một cách an toàn, công bằng, hợp lí.'],
  [9, 'B2', 'Trách nhiệm khi sử dụng AI', '9.B2.3', 'Phân tích được một số dấu hiệu của nội dung giả mạo do AI tạo ra; kiểm chứng được thông tin bằng các nguồn phù hợp và đề xuất được cách ứng phó khi phát hiện nội dung có dấu hiệu giả mạo hoặc lừa đảo.'],
  [9, 'B3', 'Kiến tạo AI công bằng', '9.B3.1', 'Giải thích được tầm quan trọng của việc huấn luyện AI theo hướng không phân biệt đối xử và tôn trọng sự đa dạng.'],
  [9, 'B3', 'Kiến tạo AI công bằng', '9.B3.2', 'Nêu được một số cách thu thập dữ liệu bảo đảm công bằng, không bỏ sót hay thiên vị các nhóm đối tượng khác nhau.'],
  [9, 'C2', 'Thực hành vận dụng AI giải quyết vấn đề, tạo ra sản phẩm đơn giản', '9.C2.1', 'Đề xuất được ý tưởng mới, sáng tạo để giải quyết một vấn đề bằng AI.'],
  [9, 'C2', 'Thực hành vận dụng AI giải quyết vấn đề, tạo ra sản phẩm đơn giản', '9.C2.MR1', 'Vận dụng được kiến thức đã học để tạo ra một công cụ AI đơn giản (ví dụ: chatbot, mô hình nhận dạng hình ảnh) dựa trên các công cụ hoặc nền tảng có sẵn; ưu tiên nền tảng mở, miễn phí, dễ sử dụng, phù hợp độ tuổi và được rà soát về an toàn.'],
  [9, 'C4', 'Cách cải thiện dữ liệu, nâng cao chất lượng của sản phẩm AI', '9.C4.1', 'Trình bày được một số cách cải thiện bộ dữ liệu để nâng cao chất lượng của sản phẩm AI (ví dụ: bổ sung dữ liệu còn thiếu, loại bỏ dữ liệu trùng lặp, sửa dữ liệu sai hoặc gán nhãn lại cho đúng).'],
  [9, 'C4', 'Cách cải thiện dữ liệu, nâng cao chất lượng của sản phẩm AI', '9.C4.MR1', 'Chỉ ra được những điểm cần cải thiện trong bộ dữ liệu cụ thể ảnh hưởng đến chất lượng của sản phẩm AI.'],
  [9, 'C4', 'Cách cải thiện dữ liệu, nâng cao chất lượng của sản phẩm AI', '9.C4.MR2', 'Thực hiện được việc cải thiện bộ dữ liệu (thêm, xoá, sửa dữ liệu) để nâng cao chất lượng của sản phẩm AI.'],
  [9, 'D1', 'Con người dẫn dắt AI', '9.D1.1', 'Trình bày được vai trò của con người là người đồng sáng tạo và dẫn dắt trong việc thiết kế, vận hành và phát triển các hệ thống, công cụ AI.'],
  [9, 'D1', 'Con người dẫn dắt AI', '9.D1.MR1', 'Phân tích được vai trò đồng sáng tạo và dẫn dắt của con người qua một hệ thống hoặc công cụ AI cụ thể (ví dụ: con người xác định mục tiêu, lựa chọn dữ liệu, đánh giá và điều chỉnh kết quả của hệ thống).'],
  [9, 'D2', 'Đánh giá và cải tiến sản phẩm AI', '9.D2.1', 'Nêu được một số cách kiểm tra đơn giản để đánh giá sản phẩm AI (ví dụ: với mô hình nhận dạng, thử với dữ liệu mới chưa dùng khi huấn luyện, đếm số lần cho kết quả đúng và sai; với chatbot, đặt nhiều câu hỏi khác nhau, kiểm tra tính chính xác và phù hợp của câu trả lời).'],
  [9, 'D2', 'Đánh giá và cải tiến sản phẩm AI', '9.D2.MR1', 'Thiết kế và thực hiện được một số kiểm tra đơn giản để đánh giá sản phẩm AI.'],
  [9, 'D2', 'Đánh giá và cải tiến sản phẩm AI', '9.D2.MR2', 'Phân tích được kết quả kiểm tra và chủ động thử nghiệm một số cách cải tiến đơn giản, phù hợp nhằm nâng cao chất lượng sản phẩm.'],
];

export const AI_INDICATORS: AiIndicator[] = RAW_AI_ROWS.map(
  ([grade, topicCode, contentTitle, code, detail]) => {
    const domainCode = topicCode[0] as 'A' | 'B' | 'C' | 'D';
    return {
      code,
      grade,
      domainCode,
      domainName: AI_DOMAIN_NAMES[domainCode],
      topicCode,
      topicName: AI_TOPIC_NAMES[topicCode] ?? topicCode,
      contentTitle,
      isExtended: code.includes('.MR'),
      detail,
    };
  }
);

export const AI_INDICATOR_MAP: Map<string, AiIndicator> = new Map(
  AI_INDICATORS.map((item) => [item.code.toUpperCase(), item])
);

export function getAiIndicatorsForGrade(grade: GradeLevel): AiIndicator[] {
  return AI_INDICATORS.filter((item) => item.grade === grade);
}

export function findAiIndicatorByCode(code: string): AiIndicator | undefined {
  return AI_INDICATOR_MAP.get(code.trim().toUpperCase());
}
