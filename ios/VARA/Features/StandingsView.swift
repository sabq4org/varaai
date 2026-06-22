import SwiftUI

struct StandingsView: View {
    let rows: [StandingRow]

    // Preserve server order while bucketing rows into their groups.
    private var groups: [(name: String?, rows: [StandingRow])] {
        var order: [String] = []
        var buckets: [String: [StandingRow]] = [:]
        for row in rows {
            let key = row.group ?? ""
            if buckets[key] == nil { order.append(key); buckets[key] = [] }
            buckets[key]?.append(row)
        }
        return order.map { ($0.isEmpty ? nil : $0, buckets[$0] ?? []) }
    }

    private var isGrouped: Bool { rows.contains { $0.group != nil } }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                ForEach(Array(groups.enumerated()), id: \.offset) { _, group in
                    VStack(spacing: 0) {
                        if let name = group.name {
                            groupHeader(name)
                        }
                        header
                        tableBody(group.rows)
                    }
                    .background(RoundedRectangle(cornerRadius: 18).fill(Theme.surface))
                    .overlay(RoundedRectangle(cornerRadius: 18).stroke(Theme.line, lineWidth: 1))
                }
            }
            .padding(.horizontal, 16)
        }
    }

    private func tableBody(_ rows: [StandingRow]) -> some View {
        LazyVStack(spacing: 0) {
            ForEach(rows) { row in
                NavigationLink(value: row.team) {
                    StandingRowView(row: row)
                }
                .buttonStyle(.plain)
                if row.id != rows.last?.id {
                    Divider().overlay(Theme.line)
                }
            }
        }
    }

    private func groupHeader(_ name: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "rectangle.3.group.fill").font(.caption).foregroundStyle(Theme.accent)
            Text(name).font(.subheadline.weight(.heavy)).foregroundStyle(Theme.text)
            Spacer()
        }
        .padding(.horizontal, 14).padding(.top, 14).padding(.bottom, 4)
    }

    private var header: some View {
        HStack(spacing: 0) {
            Text("#").frame(width: 30)
            Text("الفريق").frame(maxWidth: .infinity, alignment: .leading)
            Text("لعب").frame(width: 30)
            Text("+/-").frame(width: 36)
            Text("الأخيرة").frame(width: 86)
            Text("نقاط").frame(width: 38)
        }
        .font(.caption2).foregroundStyle(Theme.muted)
        .padding(.horizontal, 12).padding(.vertical, 12)
        .overlay(alignment: .bottom) { Divider().overlay(Theme.line) }
    }
}

private struct StandingRowView: View {
    let row: StandingRow

    private var isTop: Bool { row.rank <= 3 }

    var body: some View {
        HStack(spacing: 0) {
            Text("\(row.rank)")
                .font(.system(.subheadline, weight: .heavy))
                .frame(width: 26, height: 26)
                .background(RoundedRectangle(cornerRadius: 8).fill(isTop ? Theme.accentDim : Theme.surface2))
                .foregroundStyle(isTop ? Color(hex: 0xD8FFF3) : Theme.text)
                .frame(width: 30)

            HStack(spacing: 8) {
                AsyncImageLogo(url: row.team.logo, size: 22)
                Text(row.team.name).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.text)
                    .lineLimit(1).minimumScaleFactor(0.8)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Text("\(row.played)").frame(width: 30).foregroundStyle(Theme.muted)
            Text("\(row.goalsDiff > 0 ? "+" : "")\(row.goalsDiff)").frame(width: 36).foregroundStyle(Theme.muted)
            FormView(form: row.form).frame(width: 86)
            Text("\(row.points)").font(.system(.subheadline, weight: .heavy)).foregroundStyle(Theme.accent).frame(width: 38)
        }
        .font(.subheadline)
        .padding(.horizontal, 12).padding(.vertical, 12)
        .contentShape(Rectangle())
    }
}

struct FormView: View {
    let form: String?
    var body: some View {
        HStack(spacing: 3) {
            if let form {
                ForEach(Array(form.suffix(5).enumerated()), id: \.offset) { _, ch in
                    Text(String(ch))
                        .font(.system(size: 10, weight: .heavy))
                        .frame(width: 16, height: 16)
                        .background(RoundedRectangle(cornerRadius: 5).fill(Theme.formColor(ch)))
                        .foregroundStyle(ch == "L" ? .white : Color(hex: 0x08110D))
                }
            }
        }
    }
}
