import Foundation

// Web版 src/utils/lifeData.ts の COUNTRIES を忠実移植。
// 出典: WHO Global Health Observatory (2021-2023) / OECD 法定退職年齢

struct CountryRow: Hashable, Sendable {
    let key: String
    let nameJa: String
    let nameEn: String
    let lifeExpectancy: Double
    let healthyLifeExpectancy: Double
    let workingAgeLimit: Double
}

enum CountryData {
    static let all: [CountryRow] = [
        CountryRow(key: "Japan",          nameJa: "日本",             nameEn: "Japan",          lifeExpectancy: 84.6, healthyLifeExpectancy: 75.0, workingAgeLimit: 65),
        CountryRow(key: "Switzerland",    nameJa: "スイス",           nameEn: "Switzerland",    lifeExpectancy: 83.8, healthyLifeExpectancy: 73.0, workingAgeLimit: 65),
        CountryRow(key: "Singapore",      nameJa: "シンガポール",     nameEn: "Singapore",      lifeExpectancy: 83.6, healthyLifeExpectancy: 73.0, workingAgeLimit: 65),
        CountryRow(key: "Spain",          nameJa: "スペイン",         nameEn: "Spain",          lifeExpectancy: 83.6, healthyLifeExpectancy: 72.0, workingAgeLimit: 65),
        CountryRow(key: "Italy",          nameJa: "イタリア",         nameEn: "Italy",          lifeExpectancy: 83.5, healthyLifeExpectancy: 72.0, workingAgeLimit: 67),
        CountryRow(key: "Australia",      nameJa: "オーストラリア",   nameEn: "Australia",      lifeExpectancy: 83.4, healthyLifeExpectancy: 72.0, workingAgeLimit: 67),
        CountryRow(key: "Iceland",        nameJa: "アイスランド",     nameEn: "Iceland",        lifeExpectancy: 83.0, healthyLifeExpectancy: 72.0, workingAgeLimit: 67),
        CountryRow(key: "Israel",         nameJa: "イスラエル",       nameEn: "Israel",         lifeExpectancy: 83.0, healthyLifeExpectancy: 71.0, workingAgeLimit: 67),
        CountryRow(key: "South Korea",    nameJa: "韓国",             nameEn: "South Korea",    lifeExpectancy: 83.0, healthyLifeExpectancy: 72.0, workingAgeLimit: 60),
        CountryRow(key: "Sweden",         nameJa: "スウェーデン",     nameEn: "Sweden",         lifeExpectancy: 82.8, healthyLifeExpectancy: 72.0, workingAgeLimit: 65),
        CountryRow(key: "France",         nameJa: "フランス",         nameEn: "France",         lifeExpectancy: 82.7, healthyLifeExpectancy: 71.0, workingAgeLimit: 62),
        CountryRow(key: "Canada",         nameJa: "カナダ",           nameEn: "Canada",         lifeExpectancy: 82.4, healthyLifeExpectancy: 71.0, workingAgeLimit: 65),
        CountryRow(key: "Norway",         nameJa: "ノルウェー",       nameEn: "Norway",         lifeExpectancy: 82.4, healthyLifeExpectancy: 71.0, workingAgeLimit: 67),
        CountryRow(key: "New Zealand",    nameJa: "ニュージーランド", nameEn: "New Zealand",    lifeExpectancy: 82.2, healthyLifeExpectancy: 71.0, workingAgeLimit: 65),
        CountryRow(key: "Netherlands",    nameJa: "オランダ",         nameEn: "Netherlands",    lifeExpectancy: 82.0, healthyLifeExpectancy: 71.0, workingAgeLimit: 67),
        CountryRow(key: "Ireland",        nameJa: "アイルランド",     nameEn: "Ireland",        lifeExpectancy: 82.0, healthyLifeExpectancy: 70.0, workingAgeLimit: 66),
        CountryRow(key: "Germany",        nameJa: "ドイツ",           nameEn: "Germany",        lifeExpectancy: 81.3, healthyLifeExpectancy: 70.0, workingAgeLimit: 67),
        CountryRow(key: "United Kingdom", nameJa: "イギリス",         nameEn: "United Kingdom", lifeExpectancy: 81.2, healthyLifeExpectancy: 70.0, workingAgeLimit: 66),
        CountryRow(key: "Turkey",         nameJa: "トルコ",           nameEn: "Turkey",         lifeExpectancy: 78.6, healthyLifeExpectancy: 67.0, workingAgeLimit: 65),
        CountryRow(key: "United States",  nameJa: "アメリカ",         nameEn: "United States",  lifeExpectancy: 77.3, healthyLifeExpectancy: 68.0, workingAgeLimit: 65),
        CountryRow(key: "China",          nameJa: "中国",             nameEn: "China",          lifeExpectancy: 77.4, healthyLifeExpectancy: 68.0, workingAgeLimit: 60),
        CountryRow(key: "Saudi Arabia",   nameJa: "サウジアラビア",   nameEn: "Saudi Arabia",   lifeExpectancy: 76.9, healthyLifeExpectancy: 67.0, workingAgeLimit: 60),
        CountryRow(key: "Brazil",         nameJa: "ブラジル",         nameEn: "Brazil",         lifeExpectancy: 75.9, healthyLifeExpectancy: 66.0, workingAgeLimit: 65),
        CountryRow(key: "Mexico",         nameJa: "メキシコ",         nameEn: "Mexico",         lifeExpectancy: 75.0, healthyLifeExpectancy: 67.0, workingAgeLimit: 65),
        CountryRow(key: "Russia",         nameJa: "ロシア",           nameEn: "Russia",         lifeExpectancy: 73.4, healthyLifeExpectancy: 64.0, workingAgeLimit: 60),
        CountryRow(key: "Indonesia",      nameJa: "インドネシア",     nameEn: "Indonesia",      lifeExpectancy: 71.7, healthyLifeExpectancy: 62.0, workingAgeLimit: 58),
        CountryRow(key: "India",          nameJa: "インド",           nameEn: "India",          lifeExpectancy: 69.7, healthyLifeExpectancy: 60.0, workingAgeLimit: 60),
        CountryRow(key: "South Africa",   nameJa: "南アフリカ",       nameEn: "South Africa",   lifeExpectancy: 64.1, healthyLifeExpectancy: 58.0, workingAgeLimit: 60),
        CountryRow(key: "Nigeria",        nameJa: "ナイジェリア",     nameEn: "Nigeria",        lifeExpectancy: 54.7, healthyLifeExpectancy: 50.0, workingAgeLimit: 60),
        CountryRow(key: "Global",         nameJa: "グローバル",       nameEn: "Global",         lifeExpectancy: 73.2, healthyLifeExpectancy: 64.0, workingAgeLimit: 65),
    ]

    static let byKey: [String: CountryRow] = Dictionary(uniqueKeysWithValues: all.map { ($0.key, $0) })

    static let global: CountryRow = byKey["Global"]!

    /// Web の getLifeExpectancy(country, basis) と同一: 未知の国は Global にフォールバック
    static func expectancy(country: String, basis: CalculationBasis) -> Double {
        let row = byKey[country] ?? global
        switch basis {
        case .life: return row.lifeExpectancy
        case .healthy: return row.healthyLifeExpectancy
        case .working: return row.workingAgeLimit
        }
    }
}
