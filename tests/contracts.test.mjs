import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readJson = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'))

test('base inherits the self-hosted URL and protects the API key', async () => {
    const base = await readJson('base.iml.json')

    assert.match(base.baseUrl, /connection\.baseUrl/)
    assert.equal(base.headers.Authorization, 'Bearer {{connection.apiKey}}')
    assert.deepEqual(base.log.sanitize, ['request.headers.authorization'])
    assert.ok(base.response.error.message)
})

test('production origin targets the real Make app', async () => {
    const manifest = await readJson('makecomapp.json')
    const production = manifest.origins.find(({ label }) => label === 'Production')

    assert.equal(manifest.generalCodeFiles.base, 'base.iml.json')
    assert.equal(production.appId, 'opnform-65ly55')
})

test('attached webhook persists and reuses the remote integration id', async () => {
    const communication = await readJson('webhook/communication.json')
    const attach = await readJson('webhook/attach.json')
    const detach = await readJson('webhook/detach.json')

    assert.equal(communication.output, '{{body}}')
    assert.equal(communication.respond.type, 'json')
    assert.equal(communication.respond.status, 200)
    assert.equal(attach.body.integration_id, 'make')
    assert.equal(attach.response.data.externalHookId, '{{body.form_integration.id}}')
    assert.equal(attach.response.data.formId, '{{parameters.formId}}')
    assert.match(detach.url, /{{webhook\.formId}}/)
    assert.match(detach.url, /{{webhook\.externalHookId}}/)
    assert.doesNotMatch(detach.url, /parameters\.formId/)
    assert.doesNotMatch(detach.url, /webhook\.data/)
})

test('instant trigger preserves the bundle produced by its webhook', async () => {
    const communication = await readJson('modules/watchNewSubmissions/communication.json')
    const parameters = await readJson('modules/watchNewSubmissions/expect.json')

    assert.deepEqual(communication, {})
    assert.deepEqual(parameters, [])
})

test('form RPC follows the Laravel resource pagination envelope', async () => {
    const rpc = await readJson('rpcs/listForms.json')
    const response = {
        data: [{ id: 1, title: 'First form' }],
        links: { next: 'https://api.opnform.com/open/workspaces/1/forms?page=2' },
        meta: { current_page: 1, last_page: 2 }
    }

    assert.equal(rpc.response.iterate, '{{body.data}}')
    assert.equal(rpc.response.limit, 300)
    assert.equal(rpc.pagination.url, '{{body.links.next}}')
    assert.equal(rpc.pagination.condition, '{{body.links.next}}')
    assert.equal(response.links.next.endsWith('page=2'), true)
    assert.equal(response.next_page_url, undefined)
    assert.equal(rpc.qs.per_page, 100)
})

test('connection protects its domain and explains the required token abilities', async () => {
    const parameters = await readJson('connection/parameters.json')
    const communication = await readJson('connection/communication.json')
    const apiKey = parameters.find(({ name }) => name === 'apiKey')
    const baseUrl = parameters.find(({ name }) => name === 'baseUrl')

    assert.match(apiKey.help, /workspaces-read/)
    assert.match(apiKey.help, /forms-read/)
    assert.match(apiKey.help, /manage-integrations/)
    assert.equal(baseUrl.editable, false)
    assert.match(baseUrl.help, /cannot be changed/)
    assert.equal(communication.response.metadata.type, 'text')
    assert.equal(
        communication.response.error.message,
        "[{{statusCode}}] {{ifempty(body.message, 'Request failed')}}"
    )
})

test('user-facing labels follow Make sentence case', async () => {
    const manifest = await readJson('makecomapp.json')
    const parameters = await readJson('connection/parameters.json')
    const triggerInterface = await readJson('modules/watchNewSubmissions/interface.json')
    const universalExpect = await readJson('modules/makeAnApiCall/expect.json')

    assert.equal(manifest.components.connection.apiKeyAuth.label, 'OpnForm API key')
    assert.equal(manifest.components.module.watchNewSubmissions.label, 'Watch new submissions')
    assert.equal(manifest.components.module.makeAnApiCall.label, 'Make an API call')
    assert.equal(parameters.find(({ name }) => name === 'baseUrl').label, 'API base URL')
    assert.equal(triggerInterface.find(({ name }) => name === 'form_title').label, 'Form title')
    assert.equal(triggerInterface.find(({ name }) => name === 'form_slug').label, 'Form slug')
    assert.equal(triggerInterface.find(({ name }) => name === 'edit_link').label, 'Edit submission URL')
    assert.equal(triggerInterface.find(({ name }) => name === 'data').label, 'Form fields')
    assert.equal(universalExpect.find(({ name }) => name === 'qs').label, 'Query string')
})

test('trigger interface exposes dynamic fields and optional edit link', async () => {
    const output = await readJson('modules/watchNewSubmissions/interface.json')
    const data = output.find(({ name }) => name === 'data')
    const editLink = output.find(({ name }) => name === 'edit_link')

    assert.deepEqual(data.spec, [])
    assert.equal(editLink.type, 'url')
})

test('universal module only accepts relative API paths and uses the app connection', async () => {
    const manifest = await readJson('makecomapp.json')
    const universal = manifest.components.module.makeAnApiCall
    const communication = await readJson('modules/makeAnApiCall/communication.json')
    const parameters = await readJson('modules/makeAnApiCall/expect.json')

    assert.equal(universal.moduleType, 'universal')
    assert.equal(universal.connection, 'apiKeyAuth')
    assert.equal(communication.url, '{{parameters.url}}')
    assert.doesNotMatch(communication.url, /^https?:\/\//)
    assert.match(parameters.find(({ name }) => name === 'url').help, /\/open\/workspaces/)
})

test('Make requests use relative open API paths inherited from Base', async () => {
    const paths = [
        'rpcs/listWorkspaces.json',
        'rpcs/listForms.json',
        'webhook/attach.json',
        'webhook/detach.json'
    ]

    for (const path of paths) {
        const request = await readJson(path)
        assert.match(request.url, /^\/open\//)
        assert.doesNotMatch(request.url, /external\/make/)
    }
})
