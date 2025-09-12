import os
from datetime import datetime
import pytest

from src.db.engine import SessionLocal
from src.db.models.lead import Lead, ColdEmailTemplate, ColdPhoneCallTemplate


def test_healthz(client):
    r = client.get('/healthz')
    assert r.status_code == 200
    assert r.json()['status'] == 'ok'


def test_create_and_list_leads_basic_flow(client):
    payload = {
        "keywords": ["Friseur"],
        "use_places": False,
        "use_overpass": False,
        "city": "Berlin",
        "country_code": "DE"
    }
    r = client.post('/leads/generate', json=payload)
    assert r.status_code == 200
    data = r.json()
    assert 'found' in data

    r2 = client.get('/leads')
    assert r2.status_code == 200
    list_json = r2.json()
    items = list_json.get('items', [])
    if not items:
        with SessionLocal() as session:
            lead = Lead(company_name='Test Company', city='Berlin')
            session.add(lead)
            session.commit()
    r3 = client.get('/leads')
    assert r3.status_code == 200
    assert len(r3.json()['items']) >= 1


def test_update_interested_and_get_lead(client):
    with SessionLocal() as session:
        lead = session.query(Lead).first()
        if not lead:
            lead = Lead(company_name='Interest Co')
            session.add(lead)
            session.commit()
            session.refresh(lead)
        lead_id = lead.id
    r = client.patch(f'/leads/{lead_id}/interested', json={"interested": True})
    assert r.status_code == 200
    assert r.json()['interested'] is True

    r2 = client.get(f'/leads/{lead_id}')
    assert r2.status_code == 200
    assert r2.json()['id'] == lead_id


def test_generate_assets_for_slug_db_templates(client):
    with SessionLocal() as session:
        lead = session.query(Lead).filter(Lead.company_name == 'Slug Co').first()
        if not lead:
            lead = Lead(company_name='Slug Co')
            session.add(lead)
            session.commit()
            session.refresh(lead)
        if not session.query(ColdEmailTemplate).first():
            session.add(ColdEmailTemplate(language='en', content='Hello {{BusinessName}}'))
        if not session.query(ColdPhoneCallTemplate).first():
            session.add(ColdPhoneCallTemplate(language='en', content='Call script for {{BusinessName}}'))
        session.commit()
    slug = 'slug-co'
    r = client.post(f'/leads/{slug}/generate-assets')
    assert r.status_code == 200
    data = r.json()
    assert data['ok'] is True
    with SessionLocal() as session:
        lead = session.query(Lead).filter(Lead.company_name == 'Slug Co').first()
        assert lead.email_script and 'Slug Co' in lead.email_script
        assert lead.phone_script and 'Slug Co' in lead.phone_script


def test_assets_summary(client):
    r = client.get('/assets/slug-co/summary')
    assert r.status_code == 200
    js = r.json()
    assert js['ok'] is True
    assert 'emailScript' in js
    assert 'phoneScript' in js


def test_filter_and_generate_offers_endpoints(client):
    with SessionLocal() as session:
        session.add_all([
            Lead(company_name='Filter A', website=''),
            Lead(company_name='Filter B', website='facebook.com/profile'),
            Lead(company_name='ShouldRemove', website='https://example.com')
        ])
        session.commit()
    r = client.post('/leads/filter')
    assert r.status_code == 200
    r2 = client.post('/leads/generate-offers')
    assert r2.status_code == 200


def test_clear_leads(client):
    r = client.delete('/leads')
    assert r.status_code == 200
    js = r.json()
    assert 'deleted' in js


def test_debug_endpoints(client):
    r = client.get('/debug/db')
    assert r.status_code == 200
    r2 = client.post('/debug/create_tables')
    assert r2.status_code == 200
    r3 = client.get('/debug/filter_pipeline')
    assert r3.status_code == 200
