import SwiftUI

struct DashboardView: View {
    var body: some View {
        TabView {
            ProfileTab()
                .tabItem { Label("プロフィール", systemImage: "person.crop.circle") }
            PeopleTab()
                .tabItem { Label("大切な人", systemImage: "heart.circle") }
            WidgetsTab()
                .tabItem { Label("ウィジェット", systemImage: "rectangle.3.group") }
            GeneralTab()
                .tabItem { Label("一般", systemImage: "gearshape") }
        }
        .frame(minWidth: 620, minHeight: 480)
    }
}

// MARK: - プロフィール

struct ProfileTab: View {
    @Environment(AppStore.self) private var store

    private var birthDateBinding: Binding<Date> {
        Binding(
            get: {
                let u = store.state.user
                var cal = Calendar.current
                cal.timeZone = .current
                if let y = u.birthYear, let m = u.birthMonth, let d = u.birthDay,
                   let date = cal.date(from: DateComponents(year: y, month: m, day: d)) {
                    return date
                }
                return cal.date(from: DateComponents(year: 1990, month: 1, day: 1)) ?? .now
            },
            set: { date in
                let comps = Calendar.current.dateComponents([.year, .month, .day], from: date)
                var u = store.state.user
                u.birthYear = comps.year
                u.birthMonth = comps.month
                u.birthDay = comps.day
                u.age = nil
                store.updateProfile(u)
            }
        )
    }

    private var countryBinding: Binding<String> {
        Binding(
            get: { store.state.user.country },
            set: { c in
                var u = store.state.user
                u.country = c
                store.updateProfile(u)
            }
        )
    }

    private var basisBinding: Binding<CalculationBasis> {
        Binding(
            get: { store.state.calculationBasis },
            set: { store.setBasis($0) }
        )
    }

    var body: some View {
        Form {
            Section("あなた") {
                DatePicker("生年月日", selection: birthDateBinding, in: ...Date.now, displayedComponents: .date)
                Picker("国", selection: countryBinding) {
                    ForEach(CountryData.all, id: \.key) { row in
                        Text(row.nameJa).tag(row.key)
                    }
                }
                if let age = store.userAge {
                    LabeledContent("現在") {
                        Text("\(Formatters.decimal1(age))歳")
                            .foregroundStyle(.secondary)
                    }
                }
            }

            Section("寿命の前提（空欄 = 国の平均値）") {
                overrideRow(label: "平均寿命", basis: .life,
                            get: { $0.lifeExpectancy }, set: { $0.lifeExpectancy = $1 })
                overrideRow(label: "健康寿命", basis: .healthy,
                            get: { $0.healthyLifeExpectancy }, set: { $0.healthyLifeExpectancy = $1 })
                overrideRow(label: "労働年限", basis: .working,
                            get: { $0.workingAgeLimit }, set: { $0.workingAgeLimit = $1 })
            }

            Section("既定の基準") {
                Picker("基準", selection: basisBinding) {
                    ForEach(CalculationBasis.allCases, id: \.self) { b in
                        Text("\(L10n.basis(b))（\(L10n.basisLong(b))）").tag(b)
                    }
                }
                .pickerStyle(.segmented)
                if let ry = store.remainingYears(basis: store.state.calculationBasis),
                   let pct = store.percentRemaining(basis: store.state.calculationBasis) {
                    LabeledContent("残り") {
                        Text("\(Formatters.decimal1(ry))年（\(Formatters.percent1(pct))%）")
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .formStyle(.grouped)
    }

    @ViewBuilder
    private func overrideRow(
        label: String,
        basis: CalculationBasis,
        get: @escaping (UserProfile) -> Double?,
        set: @escaping (inout UserProfile, Double?) -> Void
    ) -> some View {
        let countryDefault = CountryData.expectancy(country: store.state.user.country, basis: basis)
        let binding = Binding<String>(
            get: { get(store.state.user).map { Formatters.decimal1($0) } ?? "" },
            set: { text in
                var u = store.state.user
                if text.isEmpty {
                    set(&u, nil)
                } else if let v = Double(text), v > 0, v < 130 {
                    set(&u, v)
                } else {
                    return
                }
                store.updateProfile(u)
            }
        )
        HStack {
            Text(label)
            Spacer()
            TextField("\(Formatters.decimal1(countryDefault))", text: binding)
                .textFieldStyle(.roundedBorder)
                .frame(width: 90)
                .multilineTextAlignment(.trailing)
            Text("歳")
                .foregroundStyle(.secondary)
        }
    }
}

// MARK: - 一般

struct GeneralTab: View {
    @Environment(AppStore.self) private var store
    @State private var launchAtLogin = LoginItem.isEnabled
    @State private var loginItemError: String?
    @State private var confirmingReset = false

    var body: some View {
        Form {
            Section("起動") {
                Toggle("ログイン時に起動", isOn: $launchAtLogin)
                    .onChange(of: launchAtLogin) { _, on in
                        do {
                            try LoginItem.set(enabled: on)
                            loginItemError = nil
                        } catch {
                            loginItemError = "設定に失敗しました。システム設定 > 一般 > ログイン項目 から手動で追加してください。"
                            launchAtLogin = LoginItem.isEnabled
                        }
                    }
                if let loginItemError {
                    Text(loginItemError)
                        .font(.caption)
                        .foregroundStyle(.orange)
                }
                Toggle("Dockアイコンを隠す（常駐アプリ化）", isOn: Binding(
                    get: { store.state.hideDockIcon },
                    set: { store.setHideDockIcon($0) }
                ))
                Text("Dockを隠しても、ウィジェットの右クリック →「設定を開く」からこの画面に戻れます。")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Section("表示") {
                Toggle("フルスクリーンアプリの上にも表示", isOn: Binding(
                    get: { store.state.showOverFullScreen },
                    set: { store.setShowOverFullScreen($0) }
                ))
                Toggle("低電力モード（コンマ秒を止めて1秒更新に）", isOn: Binding(
                    get: { store.state.lowPowerMode },
                    set: { store.setLowPowerMode($0) }
                ))
            }

            Section("データ") {
                LabeledContent("保存先") {
                    Text("~/Library/Application Support/OurLifeIsShort/state.json")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .textSelection(.enabled)
                }
                Button("Finderで表示") {
                    let url = FileManager.default
                        .urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
                        .appendingPathComponent("OurLifeIsShort")
                    NSWorkspace.shared.activateFileViewerSelecting([url])
                }
                Button("すべてリセット…", role: .destructive) {
                    confirmingReset = true
                }
                .confirmationDialog("すべてのデータを消去しますか？", isPresented: $confirmingReset) {
                    Button("消去する", role: .destructive) {
                        store.resetAll()
                    }
                } message: {
                    Text("プロフィール・大切な人・ウィジェット配置がすべて消えます。")
                }
            }
        }
        .formStyle(.grouped)
    }
}
