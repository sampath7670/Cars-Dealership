import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.core.management.color import no_style
from django.db import connection
from djangoapp.models import CarMake, CarModel, Dealer, Review

class Command(BaseCommand):
    help = 'Load fictional demonstration dealerships and cars without overwriting reviews.'
    def handle(self, *args, **options):
        data = json.loads((Path(__file__).resolve().parents[3] / 'seed/dealers.json').read_text())
        for dealer in data:
            Dealer.objects.get_or_create(id=dealer['id'], defaults={k: v for k, v in dealer.items() if k != 'id'})
        # Explicit fixture IDs must advance PostgreSQL's auto-increment sequence.
        with connection.cursor() as cursor:
            for statement in connection.ops.sequence_reset_sql(no_style(), [Dealer]):
                cursor.execute(statement)
        for make_name, models in {'Toyota': ['Camry', 'RAV4'], 'Honda': ['Civic', 'CR-V'], 'Ford': ['Mustang', 'Escape'], 'Chevrolet': ['Malibu', 'Equinox'], 'Tesla': ['Model 3', 'Model Y']}.items():
            make, _ = CarMake.objects.get_or_create(name=make_name)
            for name in models:
                CarModel.objects.get_or_create(make=make, name=name, year=2025)
        if not Review.objects.filter(name='Alex Morgan', dealer_id=1).exists():
            Review.objects.create(dealer_id=1, name='Alex Morgan', review='Friendly staff and a clear explanation of every option. A great visit!', rating=5, sentiment='positive', purchase=True, purchase_date='2025-06-12', car_make='Toyota', car_model='Camry', car_year=2025)
        self.stdout.write(self.style.SUCCESS('Seeded 8 demo dealers, 5 makes, 10 models, and a sample review.'))
