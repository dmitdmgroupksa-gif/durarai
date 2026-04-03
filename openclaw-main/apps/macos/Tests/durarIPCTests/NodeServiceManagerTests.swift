import Foundation
import Testing
@testable import Durar

@Suite(.serialized) struct NodeServiceManagerTests {
    @Test func `builds node service commands with current CLI shape`() async throws {
        try await TestIsolation.withUserDefaultsValues(["Durar.gatewayProjectRootPath": nil]) {
            let tmp = try makeTempDirForTests()
            CommandResolver.setProjectRoot(tmp.path)

            let DurarPath = tmp.appendingPathComponent("node_modules/.bin/Durar")
            try makeExecutableForTests(at: DurarPath)

            let start = NodeServiceManager._testServiceCommand(["start"])
            #expect(start == [DurarPath.path, "node", "start", "--json"])

            let stop = NodeServiceManager._testServiceCommand(["stop"])
            #expect(stop == [DurarPath.path, "node", "stop", "--json"])
        }
    }
}
