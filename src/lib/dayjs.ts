import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/ko";

// Enable parsing with custom format strings (e.g. "YYYY.MM.DD")
dayjs.extend(customParseFormat);

// Set Korean as default locale
dayjs.locale("ko");

export default dayjs;
