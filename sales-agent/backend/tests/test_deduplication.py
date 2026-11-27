from app.services.contacts import (
    extract_whatsapp_number,
    normalize_domain,
    normalize_phone,
)
from app.services.deduplication import normalize_name


def test_normalize_name_removes_accents_and_legal_suffix() -> None:
    assert normalize_name("Refrigeración del Sur S.R.L.") == "refrigeracion del sur"
    assert normalize_name("REFRIGERACIONES  DEL SUR S.A.") == "refrigeraciones del sur"


def test_normalize_phone_argentina() -> None:
    assert normalize_phone("0351 455-6677") == "+543514556677"
    assert normalize_phone("+54 9 351 555-1234") == "+5493515551234"
    assert normalize_phone("0351 455-6677 / 455-6678") == "+543514556677"


def test_normalize_domain_strips_scheme_www_and_path() -> None:
    assert normalize_domain("https://www.Example.com.ar/contacto") == "example.com.ar"
    assert normalize_domain("example.com.ar") == "example.com.ar"
    assert normalize_domain("") is None


def test_extract_whatsapp_number_from_published_link() -> None:
    assert extract_whatsapp_number("https://wa.me/5493515551234") == "+5493515551234"
    assert (
        extract_whatsapp_number("https://api.whatsapp.com/send?phone=5493515551234")
        == "+5493515551234"
    )
    assert extract_whatsapp_number("+54 9 351 555-1234") == "+5493515551234"
