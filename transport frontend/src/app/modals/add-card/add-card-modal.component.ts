import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, ViewChild } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { Card } from '../../interfaces/card.interface';
import { MatDialog, MatDialogActions, MatDialogClose, MatDialogContent } from '@angular/material/dialog';
import { DialogRef } from '@angular/cdk/dialog';
import { StripeCardElementOptions, StripeElementsOptions, TokenResult } from '@stripe/stripe-js';
import { NgxStripeModule, StripeService, StripeCardComponent } from 'ngx-stripe';
import { CardService } from '../../services/card.service';
import { HttpEventType } from '@angular/common/http';
import { CommonService } from '../../services/common.service';
import { ConfirmModal } from '../confirm-modal.component';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-add-card-modal',
  standalone: true,
  imports: [SharedModule, NgxStripeModule, MatDialogActions, MatDialogClose, MatDialogContent, FormsModule],
  templateUrl: './add-card-modal.component.html',
  styleUrl: './add-card-modal.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AddCardModalComponent implements OnInit {
  @ViewChild(StripeCardComponent) card!: StripeCardComponent;
  @ViewChild("add") add!: NgForm;

  isLoading: boolean = false
  data: any;
  custId!: string;
  cards: Card[] = []

  constructor(
    private confirmDialog: MatDialog,
    private dialogRef: DialogRef,
    private stripeService: StripeService,
    private cardService: CardService,
    private commonService: CommonService) { }

  ngOnInit() {
    this.data = this.dialogRef.config.data
    this.custId = this.dialogRef.config.data.content
    this.commonService.isLoading.subscribe((data: boolean) => {
      this.isLoading = data
    })
    this.getCardsWithCustomerDetails()
    // get all card from database with this custId

  }

  cardOptions: StripeCardElementOptions = {
    style: {
      base: {
        iconColor: '#666EE8',
        color: '#fff',
        fontWeight: '300',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSize: '18px',
        '::placeholder': {
          color: '#CFD7E0'
        }
      }
    }
  };

  elementsOptions: StripeElementsOptions = {
    locale: 'en'
  };

  createToken() {
    const name = 'admin'
    this.stripeService.createToken(this.card.element, { name }).subscribe({
      next: (result: TokenResult) => {
        if (result.token) {
          this.cardService.addCard(this.custId, result.token.id).subscribe({
            next: (data: any) => {
              if (data.type === HttpEventType.Response) {
                this.commonService.toast(data.body.message, "success")
              }
            },
            complete: () => {
              this.add.reset()
              this.getCardsWithCustomerDetails()
            }
          })
        }
      }, error: (error) => {
        console.log(error)

        // toast message for filling the card details before clicking add button

      }
    })
  }

  makeDefault(card: Card) {
    this.cardService.setDefaultCard(card.custId, card.id!).subscribe({
      next: (data: any) => {
        if (data.type === HttpEventType.Response) {
          this.commonService.toast(data.body.message, "success")
          this.getCardsWithCustomerDetails()
        }
      }
    })
    // post request to database for set default that card
    // get the user cards list from database after complete the above post request

  }

  deleteCard(card: Card) {
    let ref = this.confirmDialog.open(ConfirmModal, {
      position: { top: '2%' },
      width: '30%',
      disableClose: true,
      data: {
        title: `Delete Card`,
        action: "Delete",
        content: "Are you sure you want to delete this card?"
      }
    })

    ref.afterClosed().subscribe({
      next: (result: any) => {
        if (result === 'yes') {
          this.cardService.deleteCard(card.custId, card.id!).subscribe({
            next: (data: any) => {
              if (data.type === HttpEventType.Response) {
                this.commonService.toast(data.body.message, "success")
                this.getCardsWithCustomerDetails()
              }
            }
          })
        }
      }
    })
  }

  addCard() {
    this.createToken()
  }

  getCardsWithCustomerDetails() {
    this.cardService.getCustomerDetail(this.custId).subscribe({
      next: (customer: any) => {

        this.cardService.getCards(this.custId).subscribe({
          next: (data: any) => {
            this.cards = []

            data.data.forEach((card: any) => {
              this.cards.push({
                custId: this.custId,
                id: card.id,
                brand: card.brand,
                last4: card.last4,
                expNo: card.exp_month + '/' + card.exp_year,
                default: card.id === customer.default_source
              })
            })
          }
        })
      }
    })
  }
}
