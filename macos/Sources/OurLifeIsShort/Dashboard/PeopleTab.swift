import SwiftUI

// MARK: - 大切な人の一覧・追加・編集

struct PeopleTab: View {
    @Environment(AppStore.self) private var store
    @State private var editTarget: PersonEditTarget?

    var body: some View {
        VStack(spacing: 0) {
            if store.state.people.isEmpty {
                ContentUnavailableView(
                    "あなたの宇宙は空です",
                    systemImage: "sparkles",
                    description: Text("大切な人を追加すると、一緒に過ごせる残り時間が見えるようになります。")
                )
            } else {
                List {
                    ForEach(store.state.people) { person in
                        row(person)
                    }
                }
                .listStyle(.inset)
            }

            HStack {
                Button {
                    editTarget = PersonEditTarget(person: nil)
                } label: {
                    Label("大切な人を追加", systemImage: "plus")
                }
                .disabled(store.state.people.count >= DomainLimits.maxPeople)
                if store.state.people.count >= DomainLimits.maxPeople {
                    Text("最大\(DomainLimits.maxPeople)人まで — 本当に大切な人だけを。")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
            }
            .padding(12)
        }
        .sheet(item: $editTarget) { target in
            PersonEditView(existing: target.person)
                .environment(store)
        }
    }

    @ViewBuilder
    private func row(_ person: Person) -> some View {
        HStack(spacing: 10) {
            Circle()
                .fill(Color(hexString: person.color) ?? Theme.accentBlue)
                .frame(width: 10, height: 10)
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(person.name).fontWeight(.semibold)
                    Text(L10n.relationship(person.relationship))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    if person.isMentor == true {
                        Text("メンター")
                            .font(.caption2)
                            .padding(.horizontal, 5).padding(.vertical, 1)
                            .background(Capsule().fill(Color.yellow.opacity(0.2)))
                            .foregroundStyle(.yellow)
                    }
                }
                Text("\(L10n.frequency(person.meetingFrequency)) × \(L10n.hoursPerMeeting(person.hoursPerMeeting))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            if let result = store.timeWith(person) {
                VStack(alignment: .trailing, spacing: 2) {
                    Text("あと \(Formatters.int(result.meetings))回")
                        .font(.system(.body, design: .monospaced))
                    Text("約\(Formatters.int(result.hours))時間")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            Button("編集") { editTarget = PersonEditTarget(person: person) }
                .buttonStyle(.link)
        }
        .padding(.vertical, 4)
    }
}

private struct PersonEditTarget: Identifiable {
    let id = UUID()
    let person: Person?
}

// MARK: - 追加/編集フォーム

struct PersonEditView: View {
    @Environment(AppStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    let existing: Person?

    @State private var name = ""
    @State private var relationship: Relationship = .other
    @State private var useBirthDate = true
    @State private var birthDate = Calendar.current.date(from: DateComponents(year: 2015, month: 1, day: 1)) ?? .now
    @State private var ageText = ""
    @State private var meetingFrequency: Double = 12
    @State private var hoursPerMeeting: Double = 2
    @State private var isMentor = false

    var body: some View {
        VStack(spacing: 0) {
            Form {
                Section(existing == nil ? "大切な人を追加" : "\(existing?.name ?? "")を編集") {
                    TextField("名前", text: $name)
                    Picker("関係", selection: $relationship) {
                        ForEach(Relationship.allCases, id: \.self) { r in
                            Text(L10n.relationship(r)).tag(r)
                        }
                    }
                    Picker("年齢の入力", selection: $useBirthDate) {
                        Text("生年月日").tag(true)
                        Text("年齢を直接").tag(false)
                    }
                    .pickerStyle(.segmented)
                    if useBirthDate {
                        DatePicker("生年月日", selection: $birthDate, in: ...Date.now, displayedComponents: .date)
                    } else {
                        TextField("年齢", text: $ageText)
                            .textFieldStyle(.roundedBorder)
                    }
                }

                Section("会う条件") {
                    Picker("会う頻度", selection: $meetingFrequency) {
                        ForEach(Presets.meetingFrequencies, id: \.self) { f in
                            Text(L10n.frequency(f)).tag(f)
                        }
                    }
                    Picker("1回に過ごす時間", selection: $hoursPerMeeting) {
                        ForEach(Presets.hoursPerMeeting, id: \.self) { h in
                            Text(L10n.hoursPerMeeting(h)).tag(h)
                        }
                    }
                    Toggle("メンター（1人だけ）", isOn: $isMentor)
                }

                if let preview = previewResult {
                    Section("この条件だと") {
                        LabeledContent("会える回数") {
                            Text("あと \(Formatters.int(preview.meetings))回")
                        }
                        LabeledContent("一緒に過ごせる時間") {
                            Text("約 \(Formatters.int(preview.hours))時間（\(Formatters.int(preview.days))日分）")
                        }
                    }
                }
            }
            .formStyle(.grouped)

            Divider()
            HStack {
                if let existing {
                    Button("削除", role: .destructive) {
                        store.removePerson(id: existing.id)
                        dismiss()
                    }
                }
                Spacer()
                Button("キャンセル") { dismiss() }
                Button("保存") { save() }
                    .keyboardShortcut(.defaultAction)
                    .disabled(!canSave)
            }
            .padding(12)
        }
        .frame(width: 460, height: 560)
        .onAppear { loadExisting() }
    }

    private var canSave: Bool {
        guard !name.trimmingCharacters(in: .whitespaces).isEmpty else { return false }
        if !useBirthDate {
            guard let a = Double(ageText), a >= 0, a < 130 else { return false }
        }
        return true
    }

    private var draft: Person {
        var p = Person(
            id: existing?.id ?? Person.newID(),
            name: name.trimmingCharacters(in: .whitespaces),
            relationship: relationship,
            isMentor: isMentor,
            meetingFrequency: meetingFrequency,
            hoursPerMeeting: hoursPerMeeting,
            color: existing?.color
        )
        if useBirthDate {
            let comps = Calendar.current.dateComponents([.year, .month, .day], from: birthDate)
            p.birthYear = comps.year
            p.birthMonth = comps.month
            p.birthDay = comps.day
        } else {
            p.age = Double(ageText)
        }
        return p
    }

    private var previewResult: TimeWithPersonResult? {
        guard canSave else { return nil }
        return store.timeWith(draft)
    }

    private func loadExisting() {
        guard let p = existing else { return }
        name = p.name
        relationship = p.relationship ?? .other
        isMentor = p.isMentor ?? false
        meetingFrequency = p.meetingFrequency
        hoursPerMeeting = p.hoursPerMeeting
        if let y = p.birthYear, let m = p.birthMonth, let d = p.birthDay {
            useBirthDate = true
            birthDate = Calendar.current.date(from: DateComponents(year: y, month: m, day: d)) ?? .now
        } else if let a = p.age {
            useBirthDate = false
            ageText = String(format: "%g", a)
        }
    }

    private func save() {
        if existing == nil {
            store.addPerson(draft)
        } else {
            store.updatePerson(draft)
        }
        dismiss()
    }
}

extension Person {
    init(
        id: String, name: String, relationship: Relationship?, isMentor: Bool?,
        meetingFrequency: Double, hoursPerMeeting: Double, color: String?
    ) {
        self.init(
            id: id, name: name, relationship: relationship, isMentor: isMentor,
            age: nil, birthYear: nil, birthMonth: nil, birthDay: nil,
            meetingFrequency: meetingFrequency, hoursPerMeeting: hoursPerMeeting,
            color: color
        )
    }
}
