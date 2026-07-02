import SwiftUI

// MARK: - ウィジェットギャラリー + 配置済み管理

struct WidgetsTab: View {
    @Environment(AppStore.self) private var store
    @State private var showingCustomPeriod = false

    var body: some View {
        Form {
            Section("デスクトップに追加") {
                gallery
            }

            Section("配置済みウィジェット") {
                if store.state.widgets.isEmpty {
                    Text("まだウィジェットがありません。上から追加してください。")
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(store.state.widgets) { widget in
                        placedRow(widget)
                    }
                }
            }
        }
        .formStyle(.grouped)
        .sheet(isPresented: $showingCustomPeriod) {
            CustomPeriodSheet()
                .environment(store)
        }
    }

    private var gallery: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                addButton(.lifeCountdown, icon: "timer")
                addButton(.lifeBattery, icon: "battery.75percent")
                addButton(.metrics, icon: "chart.bar.horizontal.page")
            }
            HStack(spacing: 8) {
                addButton(.dayProgress, icon: "sun.horizon")
                addButton(.yearProgress, icon: "calendar")
                Button {
                    showingCustomPeriod = true
                } label: {
                    Label(L10n.widgetKind(.customPeriod), systemImage: "flag.checkered")
                }
            }
            HStack(spacing: 8) {
                if store.state.people.isEmpty {
                    Label("大切な人（先に追加してください）", systemImage: "heart")
                        .foregroundStyle(.secondary)
                } else {
                    Menu {
                        ForEach(store.state.people) { person in
                            Button(person.name) {
                                var config = WidgetConfig(kind: .person)
                                config.personID = person.id
                                store.addWidget(config)
                            }
                        }
                    } label: {
                        Label(L10n.widgetKind(.person), systemImage: "heart")
                    }
                    .frame(width: 180)
                    addButton(.comparison, icon: "person.3")
                }
            }
        }
        .padding(.vertical, 4)
    }

    private func addButton(_ kind: WidgetKind, icon: String) -> some View {
        Button {
            var config = WidgetConfig(kind: kind)
            if kind == .lifeBattery { config.displayMode = .battery }
            store.addWidget(config)
        } label: {
            Label(L10n.widgetKind(kind), systemImage: icon)
        }
    }

    @ViewBuilder
    private func placedRow(_ widget: WidgetConfig) -> some View {
        HStack(spacing: 10) {
            Toggle("", isOn: Binding(
                get: { widget.isVisible },
                set: { on in store.updateWidget(id: widget.id) { $0.isVisible = on } }
            ))
            .toggleStyle(.switch)
            .controlSize(.mini)
            .labelsHidden()

            VStack(alignment: .leading, spacing: 1) {
                Text(widgetTitle(widget))
                if widget.clickThrough {
                    Text("クリック透過中")
                        .font(.caption2)
                        .foregroundStyle(.orange)
                }
            }
            Spacer()

            Picker("", selection: Binding(
                get: { widget.pin },
                set: { p in store.updateWidget(id: widget.id) { $0.pin = p } }
            )) {
                ForEach(PinLevel.allCases, id: \.self) { p in
                    Text(L10n.pin(p)).tag(p)
                }
            }
            .labelsHidden()
            .frame(width: 140)

            Picker("", selection: Binding(
                get: { widget.sizeClass },
                set: { s in store.updateWidget(id: widget.id) { $0.sizeClass = s } }
            )) {
                ForEach(WidgetSize.allCases, id: \.self) { s in
                    Text(s.rawValue).tag(s)
                }
            }
            .labelsHidden()
            .frame(width: 60)

            Toggle("透過", isOn: Binding(
                get: { widget.clickThrough },
                set: { on in store.updateWidget(id: widget.id) { $0.clickThrough = on } }
            ))
            .toggleStyle(.checkbox)

            Button {
                store.removeWidget(id: widget.id)
            } label: {
                Image(systemName: "trash")
            }
            .buttonStyle(.borderless)
        }
    }

    private func widgetTitle(_ widget: WidgetConfig) -> String {
        if widget.kind == .person, let p = store.person(id: widget.personID) {
            return "\(L10n.widgetKind(.person)): \(p.name)"
        }
        if case .custom(_, _, let label)? = widget.period {
            return "\(L10n.widgetKind(.customPeriod)): \(label)"
        }
        return L10n.widgetKind(widget.kind)
    }
}

// MARK: - カスタム期間の追加シート

struct CustomPeriodSheet: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    @State private var label = ""
    @State private var start = Date.now
    @State private var end = Calendar.current.date(byAdding: .month, value: 1, to: .now) ?? .now

    var body: some View {
        VStack(spacing: 0) {
            Form {
                Section("カスタム期間") {
                    TextField("ラベル（例: プロジェクトX、40歳まで）", text: $label)
                    DatePicker("開始", selection: $start, displayedComponents: .date)
                    DatePicker("終了", selection: $end, displayedComponents: .date)
                }
            }
            .formStyle(.grouped)
            Divider()
            HStack {
                Spacer()
                Button("キャンセル") { dismiss() }
                Button("追加") {
                    var config = WidgetConfig(kind: .customPeriod)
                    config.period = .custom(
                        start: Calendar.current.startOfDay(for: start),
                        end: Calendar.current.startOfDay(for: end),
                        label: label.isEmpty ? "カスタム期間" : label
                    )
                    store.addWidget(config)
                    dismiss()
                }
                .keyboardShortcut(.defaultAction)
                .disabled(end <= start)
            }
            .padding(12)
        }
        .frame(width: 420, height: 260)
    }
}
